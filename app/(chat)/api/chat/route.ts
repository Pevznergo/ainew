import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  decrementUserBalance,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  getModelByName,
  getUserById,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { VisibilityType } from '@/components/visibility-selector';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { xai } from '@ai-sdk/xai';
import { chatModels, type ChatModel } from '@/lib/ai/models';
import { eq } from 'drizzle-orm';
import { message } from '@/lib/db/schema';
import { db } from '@/lib/db/index';
import { cookies } from 'next/headers';

const providerMap = {
  openai,
  anthropic,
  google,
  deepseek,
  xai,
};

function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-4o-mini-2024-07-18')) return openai(modelId);
  if (modelId.startsWith('gpt-4.1-2025-04-14')) return openai(modelId);
  if (modelId.startsWith('o3-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('o3-mini-2025-01-31')) return openai(modelId);
  if (modelId.startsWith('o1-mini-2024-09-12')) return openai(modelId);
  if (modelId.startsWith('o4-mini-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('Claude Sonnet 4')) return anthropic(modelId);
  if (modelId.startsWith('Claude 3.7 Sonnet')) return anthropic(modelId);
  if (modelId.startsWith('gemini-2.5-pro')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash-lite')) return google(modelId);
  if (modelId.startsWith('Grok 3')) return xai(modelId);
  if (modelId.startsWith('Grok 3 Mini')) return xai(modelId);
  throw new Error(`Unknown provider for modelId: ${modelId}`);
}

export function getModelById(modelId: string) {
  console.log('getModelById called with:', modelId);

  const model = chatModels.find((m) => m.id === modelId);
  console.log('Found model in chatModels:', model);

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const providerModel = getProviderByModelId(model.id);
  console.log('Provider model:', providerModel);

  return providerModel;
}

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  // Получаем модель из cookie вместо URL
  const cookieStore = await cookies();
  const modelFromCookie = cookieStore.get('chat-model')?.value;
  console.log('Cookie in API:', modelFromCookie);
  const selectedChatModel = modelFromCookie || 'gpt-4o-mini-2024-07-18';

  console.log('Using model from cookie:', modelFromCookie);
  console.log('Final selected model:', selectedChatModel);

  console.log('=== POST /api/chat called ===');

  try {
    const body = await request.json();
    console.log('Request body:', body);

    // useChat отправляет { messages, id }
    const { messages, id } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Получаем последнее сообщение пользователя
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      console.error('No user message found:', userMessage);
      return new Response(JSON.stringify({ error: 'No user message found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Получаем модель из URL параметров или используем дефолтную
    const selectedVisibilityType = 'private';

    console.log('Using model:', selectedChatModel);
    console.log('User message:', userMessage);

    console.log('About to call auth()...');
    const session = await auth();
    console.log('Auth result:', session);

    if (!session?.user) {
      console.log('ERROR: No session or user');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Проверка баланса
    const [chatModel, user] = await Promise.all([
      Promise.resolve(chatModels.find((m) => m.id === selectedChatModel)),
      getUserById(session.user.id),
    ]);

    if (!chatModel) {
      console.error('Model not found for id:', selectedChatModel);
      return new Response(
        JSON.stringify({
          error: 'Model not found',
          details: `Model with id ${selectedChatModel} not found`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const cost = chatModel.cost;
    const balance = user.balance;

    console.log('Model cost:', cost, 'User balance:', balance);

    if (cost > balance) {
      console.log('Insufficient balance for model:', selectedChatModel);
      return new ChatSDKError('rate_regular:chat').toResponse();
    }

    // Списываем стоимость модели с баланса пользователя
    await decrementUserBalance(session.user.id, cost);
    console.log('Balance decremented successfully');

    // Получаем или создаем чат
    const chat = await getChatById({ id });
    if (!chat) {
      console.log('Chat not found, creating new chat with id:', id);
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      console.log('Generated title:', title);
      try {
        await saveChat({
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });
        console.log('Chat saved successfully');
      } catch (error) {
        console.error('Error saving chat:', error);
        return new ChatSDKError('bad_request:api').toResponse();
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
      console.log('Found existing chat:', chat);
    }

    // Получаем сообщения из БД и добавляем новое
    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), userMessage];

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log('About to save messages with chatId:', id);
    try {
      // Проверяем, не существует ли уже сообщение с таким ID
      const existingMessage = await db
        .select()
        .from(message)
        .where(eq(message.id, userMessage.id))
        .limit(1);

      if (existingMessage.length === 0) {
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: userMessage.id,
              role: 'user',
              parts: userMessage.parts.map((part) => {
                if (part.type === 'text' || !part.type) {
                  return {
                    type: 'text' as const,
                    text: 'text' in part ? part.text || '' : '',
                  };
                } else {
                  return {
                    type: 'image' as const,
                    imageUrl: 'url' in part ? part.url || '' : '',
                  };
                }
              }) as Array<{
                type: 'text' | 'image';
                text?: string;
                imageUrl?: string;
              }>,
              attachments: [],
              createdAt: new Date(),
            },
          ],
        });
        console.log('Messages saved successfully');
      } else {
        console.log('Message already exists, skipping save');
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      if (
        !(error instanceof Error && error.message.includes('duplicate key'))
      ) {
        return new ChatSDKError('bad_request:api').toResponse();
      }
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: async (messageStream) => {
        console.log('Starting execute function...');

        try {
          console.log('LLM request:', {
            model: selectedChatModel,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: convertToModelMessages(uiMessages).map((msg) => ({
              role: msg.role,
              content: JSON.stringify(msg.content),
              contentLength: Array.isArray(msg.content)
                ? msg.content.length
                : 'not array',
            })),
          });

          console.log('About to call LLM with model:', selectedChatModel);
          const model = getProviderByModelId(selectedChatModel);
          console.log('Model object:', model);

          const result = await streamText({
            model: model as any,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: convertToModelMessages(uiMessages),
          });
          console.log('streamText completed, result:', result);

          // УБРАТЬ сохранение отсюда - оно блокирует поток
          // const assistantMessage = { ... };
          // await saveMessages({ messages: [assistantMessage] });

          console.log('About to consume stream...');
          result.consumeStream();
          console.log('Stream consumed');

          console.log('About to merge message stream...');
          messageStream.merge(
            result.toUIMessageStream({
              sendReasoning: true,
            }),
          );
          console.log('Message stream merged');
        } catch (error) {
          console.error('Error in execute function:', error);
          throw error;
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    console.log('About to return response...');
    if (streamContext) {
      const response = await streamContext.resumableStream(streamId, () =>
        stream.pipeThrough(new JsonToSseTransformStream()),
      );
      console.log('Returning resumable stream response');
      return new Response(response, { status: 200 });
    } else {
      console.log('Returning regular stream response');
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
        status: 200,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack',
    );

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
