import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  streamText,
} from 'ai';
import { auth, } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  getUserById,
  getGuestMessageCount,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { guestRegex } from '@/lib/constants';
import {
  checkUserEntitlements,
} from '@/lib/ai/entitlements';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { chatModels, DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { eq } from 'drizzle-orm';
import { message } from '@/lib/db/schema';
import { db } from '@/lib/db/index';
import { cookies } from 'next/headers';
// OpenAI direct and OpenRouter clients
const openaiDirect = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.APP_ORIGIN || '',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Ainew',
  },
});

function getProviderByModelId(modelId: string) {
  // Any OpenRouter vendor-namespaced id should go to OpenRouter
  if (modelId.includes('/')) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is required for namespaced models');
    }
    console.log('[ProviderSelect] Using OpenRouter (namespaced):', modelId);
    return openrouter(modelId);
  }
  // Route GPT-5 family through OpenRouter (OpenRouter-style ids)
  if (
    modelId === 'openai/gpt-5-mini' ||
    modelId === 'openai/gpt-5-chat' ||
    modelId.startsWith('openai/gpt-5')
  ) {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    if (!hasOpenRouter) {
      throw new Error('OpenRouter API key is required for GPT-5 models');
    }
    console.log('[ProviderSelect] Using OpenRouter for model:', modelId);
    return openrouter(modelId);
  }
  // Prefer direct OpenAI for OpenAI-family models when available
  if (
    modelId.startsWith('gpt-') ||
    modelId.startsWith('o3-') ||
    modelId.startsWith('o1-') ||
    modelId.startsWith('o4-')
  ) {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    if (hasOpenAI) return openaiDirect(modelId);
    if (hasOpenRouter) return openrouter(modelId);
    throw new Error('No API key available for OpenAI models');
  }
  if (modelId.startsWith('claude-sonnet-4-20250514')) return anthropic(modelId);
  if (modelId.startsWith('claude-3-7-sonnet-20250219'))
    return anthropic(modelId);
  if (modelId.startsWith('gemini-2.5-pro')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash-lite')) return google(modelId);
  if (modelId.startsWith('grok-3')) return xai(modelId);
  if (modelId.startsWith('grok-3-mini')) return xai(modelId);
  if (modelId.startsWith('x-ai/')) return xai(modelId);

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3')
    return openrouter(modelId);
  if (modelId === 'flux_1.1_pro')
    throw new Error('Unsupported model without OpenRouter provider: flux_1.1_pro');
  if (modelId === 'midjourney')
    throw new Error('Unsupported model without OpenRouter provider: midjourney');

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

// Removed openrouterProvider; using openaiOR above

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
  const selectedRawModel = modelFromCookie || DEFAULT_CHAT_MODEL;
  // Map cookie/raw ids to entitlements ids defined in lib/ai/models.ts (chatModels)
  const selectedChatModel = (() => {
    if (/^gpt-4o-mini/.test(selectedRawModel)) return 'gpt-4o-mini-2024-07-18';
    if (/^gpt-4o(?!-mini)/.test(selectedRawModel)) return 'gpt-4o-mini-2024-07-18';
    return selectedRawModel;
  })();

  console.log('Using model from cookie:', modelFromCookie);
  console.log('Final selected model:', selectedChatModel);

  console.log('=== POST /api/chat called ===');

  try {
    const url = new URL(request.url);
    const debugRaw = url.searchParams.get('raw') === '1';
    const body = await request.json();
    console.log('Request body:', body);

    // Validate OpenRouter availability for namespaced models
    if (selectedChatModel.includes('/')) {
      if (!process.env.OPENROUTER_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'OpenRouter not configured',
            message:
              'Для выбранной модели требуется OPENROUTER_API_KEY. Установите ключ и повторите запрос.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // useChat отправляет { messages, id }
    const { messages } = body as any;
    // Нормализуем chatId: если отсутствует/пустой — генерируем
    const chatId: string =
      typeof (body as any)?.id === 'string' && (body as any).id.trim()
        ? (body as any).id
        : generateUUID();

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
      // Вместо JSON-ошибки — вернём поток с сообщением ассистента в чат
      const errorText =
        error instanceof Error
          ? error.message
          : 'Недостаточно токенов для отправки сообщения. Пополните баланс.';

      // Гарантируем, что чат существует (как в основной ветке ниже)
      try {
        const existingChat = await getChatById({ id: chatId });
        if (!existingChat) {
          const title = await generateTitleFromUserMessage({ message: userMessage });
          await saveChat({
            id: chatId,
            userId: session.user.id,
            title,
            visibility: selectedVisibilityType,
          });
        }
      } catch (e) {
        console.warn('Failed to ensure chat exists before error stream:', e);
      }

      const assistantMessage = {
        id: generateUUID(),
        chatId: chatId,
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: errorText }],
        attachments: [],
        createdAt: new Date(),
      };

      // Сохраняем сообщение ассистента в БД, чтобы отображалось в истории
      try {
        await saveMessages({
          messages: [assistantMessage],
        });
      } catch (e) {
        console.error('Failed to save assistant error message:', e);
        // Продолжаем стримить даже если сохранение не удалось
      }

      // Возвращаем JSON-ошибку, чтобы onError хука useChat отработал и добавил сообщение в чат
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance',
          message: errorText,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Получаем или создаем чат
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      console.log('Chat not found, creating new chat with id:', chatId);
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      console.log('Generated title:', title);
      try {
        await saveChat({
          id: chatId,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });
        console.log('Chat saved successfully');
      } catch (error: any) {
        console.error('Error saving chat (1st attempt):', error);
        // Fallback: try with a safe static title
        try {
          await saveChat({
            id: chatId,
            userId: session.user.id,
            title: 'Новый чат',
            visibility: selectedVisibilityType,
          });
          console.log('Chat saved successfully with fallback title');
        } catch (error2: any) {
          console.error('Error saving chat (fallback failed):', error2);
          return new Response(
            JSON.stringify({
              error: 'Bad request',
              message: 'Invalid request data',
              details: error2?.message || String(error2),
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
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
    const messagesFromDb = await getMessagesByChatId({ id: chatId });
    const uiMessages = [...convertToUIMessages(messagesFromDb), userMessage];

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log('About to save messages with chatId:', chatId);
    try {
      // Normalize userMessage into text parts regardless of SDK shape
      const userTextFromContent = Array.isArray((userMessage as any)?.content)
        ? (userMessage as any).content
            .filter((b: any) => b && b.type === 'text' && typeof b.text === 'string')
            .map((b: any) => b.text)
            .join('\n\n')
        : typeof (userMessage as any)?.content === 'string'
          ? (userMessage as any).content
          : '';
      const userTextFromParts = Array.isArray((userMessage as any)?.parts)
        ? (userMessage as any).parts
            .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
            .map((p: any) => p.text)
            .join('\n\n')
        : '';
      const userNormalizedText = userTextFromContent || userTextFromParts || '';

      // Проверяем, не существует ли уже сообщение с таким ID
      const existingMessage = await db
        .select()
        .from(message)
        .where(eq(message.id, (userMessage as any)?.id ?? ''))
        .limit(1);

      if (existingMessage.length === 0) {
        const ensuredUserMessageId = (userMessage as any)?.id || generateUUID();
        if (userNormalizedText.trim().length > 0) {
          await saveMessages({
            messages: [
              {
                chatId,
                id: ensuredUserMessageId,
                role: 'user',
                parts: [{ type: 'text', text: userNormalizedText }],
                attachments: [],
                createdAt: new Date(),
              },
            ],
          });
        } else {
          console.warn('Skipping user message save: no text derived');
        }
        console.log('Messages saved successfully');
      } else {
        console.log('Message already exists, skipping save');
      }
    } catch (error: any) {
      console.error('Error saving messages:', error);
      if (
        !(error instanceof Error && error.message.includes('duplicate key'))
      ) {
        return new Response(
          JSON.stringify({
            error: 'Bad request',
            message: 'Invalid request data',
            details: error?.message || String(error),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId });

    // Debug path: bypass UI stream and return raw provider stream directly
    if (debugRaw) {
      const uiMessages = convertToUIMessages(messages);
      const modelMessages = convertToModelMessages(uiMessages);
      const normalizedModelId = (() => {
        if (/^gpt-4o-mini/.test(selectedChatModel)) return 'gpt-4o-mini';
        if (/^gpt-4o(?!-mini)/.test(selectedChatModel)) return 'gpt-4o';
        return selectedChatModel;
      })();
      const effectiveModelId =
        normalizedModelId.startsWith('o3-') || normalizedModelId.startsWith('o1-')
          ? 'gpt-4o-mini'
          : normalizedModelId;
      const model = getProviderByModelId(effectiveModelId);
      const result = await streamText({
        model: model as any,
        system: systemPrompt({ selectedChatModel, requestHints }),
        messages: modelMessages,
      });
      const resp = (result as any).toAIStreamResponse?.() || (result as any).toDataStreamResponse?.();
      if (resp) return resp as Response;
      const readable = (result as any).toReadableStream?.();
      if (readable) return new Response(readable as ReadableStream);
      // Fallback to UI stream if no helper available
    }

    // For OpenRouter namespaced models, use the unified UI stream merge below

    const stream = createUIMessageStream({
      execute: async (messageStream) => {
        console.log('Starting execute function...');

        try {
          const modelMessages = convertToModelMessages(uiMessages);
          const msgDebug = modelMessages.map((m, idx) => {
            const blocks = Array.isArray(m.content) ? m.content : [];
            const texts = blocks
              .filter((b: any) => b && b.type === 'text')
              .map((b: any) => (b.text || '').slice(0, 200));
            return {
              idx,
              role: m.role,
              blocks: blocks.map((b: any) => b?.type),
              textPreview: texts.join(' ').slice(0, 200),
              blocksCount: blocks.length,
              textBlocksCount: texts.length,
            };
          });
          const lastUser = [...modelMessages].reverse().find((m: any) => m.role === 'user');
          const lastUserContent = Array.isArray(lastUser?.content) ? (lastUser?.content as any[]) : [];
          const lastUserText = lastUserContent
            .filter((b: any) => b && b.type === 'text')
            .map((b: any) => b.text || '')
            .join('')
            .trim();

          console.log('LLM request (deep):', {
            model: selectedChatModel,
            systemPreview: systemPrompt({ selectedChatModel, requestHints }).slice(0, 200),
            messages: msgDebug,
            lastUserHasText: !!lastUserText,
            lastUserTextPreview: (lastUserText || '').slice(0, 200),
          });

          // Normalize common dated OpenAI model ids to canonical ids
          const normalizedModelId = (() => {
            if (/^gpt-4o-mini/.test(selectedChatModel)) return 'gpt-4o-mini';
            if (/^gpt-4o(?!-mini)/.test(selectedChatModel)) return 'gpt-4o';
            return selectedChatModel;
          })();

          const effectiveModelId =
            normalizedModelId.startsWith('o3-') || normalizedModelId.startsWith('o1-')
              ? 'gpt-4o-mini'
              : normalizedModelId;
          console.log('About to call LLM with model:', selectedChatModel, 'normalized:', normalizedModelId, 'effective:', effectiveModelId);
          const model = getProviderByModelId(effectiveModelId);
          console.log('Model object:', model);

          if (!lastUserText) {
            console.warn('Abort: last user text is empty, nothing to answer');
            throw new Error('Empty user text');
          }

          const result = await streamText({
            model: model as any,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: modelMessages,
          });
          console.log('streamText completed, result:', result);

          // Do NOT consume the stream before merging; merging will stream tokens to the client

          // debugRaw handled before creating UI stream

          console.log('About to merge message stream (reverted to SDK merge)...');
          messageStream.writer.merge(
            result.toUIMessageStream({
              sendReasoning: false,
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
        // Suppress emitting fallback text into the stream
        return '';
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
