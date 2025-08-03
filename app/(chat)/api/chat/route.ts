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
  getGuestMessageCount,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment, guestRegex } from '@/lib/constants';
import {
  entitlementsByUserType,
  checkUserEntitlements,
} from '@/lib/ai/entitlements';
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
import type { User } from '@/lib/db/schema';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-4o-mini-2024-07-18')) return openai(modelId);
  if (modelId.startsWith('gpt-4.1-2025-04-14')) return openai(modelId);
  if (modelId.startsWith('o3-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('o3-mini-2025-01-31')) return openai(modelId);
  if (modelId.startsWith('o1-mini-2024-09-12')) return openai(modelId);
  if (modelId.startsWith('o4-mini-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('claude-sonnet-4-20250514')) return anthropic(modelId);
  if (modelId.startsWith('claude-3-7-sonnet-20250219'))
    return anthropic(modelId);
  if (modelId.startsWith('gemini-2.5-pro')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash-lite')) return google(modelId);
  if (modelId.startsWith('grok-3')) return xai(modelId);
  if (modelId.startsWith('grok-3-mini')) return xai(modelId);
  if (modelId.startsWith('x-ai/')) return openrouterProvider.chat(modelId);

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3')
    return openai(modelId);
  if (modelId === 'flux_1.1_pro') return openrouterProvider.chat(modelId);
  if (modelId === 'midjourney') return openrouterProvider.chat(modelId);

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

export const openrouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export async function POST(request: Request) {
  console.log('=== POST /api/chat called ===');
  console.log(
    'Request headers:',
    Object.fromEntries(request.headers.entries()),
  );

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
    console.log('Session user:', session?.user);
    console.log('User email:', session?.user?.email);
    console.log(
      'Guest regex test:',
      session?.user ? guestRegex.test(session.user.email) : false,
    );

    if (!session?.user) {
      console.log('ERROR: No session or user');
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'User not found',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Проверяем права пользователя
    const user = await getUserById(session.user.id);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'User not found',
          message: 'User data not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const isGuest = guestRegex.test(user.email);

    if (isGuest) {
      const guestMessageCount = await getGuestMessageCount(user.id);
      const maxGuestMessages = 3;

      console.log(
        'Guest message count:',
        guestMessageCount,
        'Max:',
        maxGuestMessages,
      );

      if (guestMessageCount >= maxGuestMessages) {
        return new Response(
          JSON.stringify({
            error: 'Guest message limit exceeded',
            message:
              'Достигнут лимит сообщений для гостевого пользователя. Пожалуйста, зарегистрируйтесь для продолжения.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Проверяем баланс для всех пользователей
    try {
      await checkUserEntitlements(user, selectedChatModel);
      console.log('Entitlements check passed');
    } catch (error) {
      console.error('Entitlements check failed:', error);
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance',
          message:
            error instanceof Error
              ? error.message
              : 'Недостаточно токенов для отправки сообщения. Пополните баланс.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

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
        return new Response(
          JSON.stringify({
            error: 'Bad request',
            message: 'Invalid request data',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You do not have permission to access this chat',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
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
        return new Response(
          JSON.stringify({
            error: 'Bad request',
            message: 'Invalid request data',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
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
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          throw error;
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        console.error('Stream error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack',
        });
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

    if (error.message.includes('лимит сообщений')) {
      return new Response(
        JSON.stringify({
          error: 'Guest message limit exceeded',
          message: error.message,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (error.message.includes('Недостаточно токенов')) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance',
          message: error.message,
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad request',
        message: 'Invalid request data',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const session = await auth();

  if (!session?.user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'User not found',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to access this chat',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
