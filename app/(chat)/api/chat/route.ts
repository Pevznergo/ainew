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
  console.log('=== POST /api/chat called ===');

  try {
    const { messages, model: modelFromClient } = await request.json();
    console.log('Request messages:', messages);
    console.log('Request model:', modelFromClient);

    // Получаем модель из URL параметров
    const url = new URL(request.url);
    const modelFromUrl = url.searchParams.get('model');
    const selectedChatModel =
      modelFromUrl || modelFromClient || 'gpt-4o-mini-2024-07-18';
    console.log('Using model:', selectedChatModel);

    // Остальная логика остается той же...
    const {
      id,
      message: userMessage,
      selectedVisibilityType,
    } = {
      id: generateUUID(),
      message: messages?.at(-1),
      selectedVisibilityType: 'private',
    };

    if (!id || !userMessage || !selectedChatModel || !selectedVisibilityType) {
      console.log('ERROR: Missing required fields:', {
        id,
        message,
        selectedChatModel,
        selectedVisibilityType,
      });
      return new ChatSDKError('bad_request:api').toResponse();
    }

    // Type assertion after validation
    const validatedMessage = userMessage as ChatMessage;

    console.log('About to call auth()...');
    const session = await auth();
    console.log('Auth result:', session);

    if (!session?.user) {
      console.log('ERROR: No session or user');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    console.log('Step: after getMessageCountByUserId');
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    // Проверка: если гость и не gpt-4o-mini-2024-07-18
    if (
      userType === 'guest' &&
      selectedChatModel !== 'gpt-4o-mini-2024-07-18'
    ) {
      return new ChatSDKError('rate_guest:chat').toResponse();
    }

    // --- Новый блок: Проверка баланса и списание стоимости ---
    // Получаем модель из массива и пользователя из БД
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
    // --- Конец нового блока ---

    console.log('Step: after getChatById');
    const chat = await getChatById({ id });

    if (!chat) {
      console.log('Chat not found, creating new chat with id:', id);
      const title = await generateTitleFromUserMessage({
        message: validatedMessage,
      });

      console.log('Generated title:', title);
      console.log('Saving chat with data:', {
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });

      try {
        await saveChat({
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });
        console.log('Chat saved successfully');

        // Проверяем, что чат действительно создался
        const verifyChat = await getChatById({ id });
        if (!verifyChat) {
          console.error('Chat was not saved properly, retrying...');
          // Повторная попытка через небольшую задержку
          await new Promise((resolve) => setTimeout(resolve, 500));
          const retryChat = await getChatById({ id });
          if (!retryChat) {
            console.error('Chat still not found after retry');
            return new ChatSDKError('bad_request:api').toResponse();
          }
          console.log('Chat found after retry:', retryChat);
        } else {
          console.log('Chat verified after save:', verifyChat);
        }
      } catch (error) {
        console.error('Error saving chat:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        return new ChatSDKError('bad_request:api').toResponse();
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
      console.log('Found existing chat:', chat);
    }

    // Проверяем, что чат существует перед сохранением сообщений
    const finalChat = await getChatById({ id });
    if (!finalChat) {
      console.error('Chat not found before saving messages, id:', id);
      return new ChatSDKError('bad_request:api').toResponse();
    }

    console.log('Final chat check passed:', finalChat);

    // Убираем проверку создания чата - просто продолжаем
    console.log('Step: after getMessagesByChatId');
    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [
      ...convertToUIMessages(messagesFromDb),
      validatedMessage,
    ];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
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

      if (existingMessage.length > 0) {
        console.log('Message already exists, skipping save');
      } else {
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
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      // Не возвращаем ошибку, если сообщение уже существует
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('Message already exists, continuing...');
      } else {
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
          console.log('selectedChatModel value:', selectedChatModel);
          const model = getProviderByModelId(selectedChatModel);
          console.log('Model object:', model);
          console.log('Model type:', typeof model);
          console.log('Model constructor:', model?.constructor?.name);
          const result = await streamText({
            model: model as any,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: convertToModelMessages(uiMessages),
          });
          console.log('streamText completed, result:', result);

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

          // Убираем finishReason и сохраняем сообщение позже
        } catch (error) {
          console.error('Error in execute function:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }
      },
      onError: (error) => {
        console.error('Ошибка в createUIMessageStream:', error);
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
