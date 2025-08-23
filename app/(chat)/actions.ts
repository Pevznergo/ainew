'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  saveChat,
  getUserReferralCode,
  getChatById,
  getFirstUserMessageByChatId,
  setChatHashtags,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { openai } from '@ai-sdk/openai';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/app/(auth)/auth';

export async function getReferralCode(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('User not authenticated');
    return null;
  }
  try {
    const code = await getUserReferralCode(session.user.id);
    return code;
  } catch (error) {
    console.error('Failed to get referral code:', error);
    return null;
  }
}

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: openai('gpt-4o-mini-2024-07-18'),
    system: `
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const updated = await updateChatVisiblityById({ chatId, visibility });

  try {
    if (visibility === 'public') {
      const chat = await getChatById({ id: chatId });
      const existing = (chat as any)?.hashtags as string[] | undefined;
      if (!existing || existing.length === 0) {
        const firstMsg = await getFirstUserMessageByChatId({ chatId });
        const textParts = Array.isArray((firstMsg as any)?.parts)
          ? (firstMsg as any).parts
          : [];
        const firstText = (() => {
          for (const p of textParts) {
            if (p?.type === 'text' && typeof p.text === 'string' && p.text.trim()) return p.text.trim();
          }
          return '';
        })();

        if (firstText) {
          const { text } = await generateText({
            model: openai('gpt-4o-mini-2024-07-18'),
            system:
              'Сгенерируй 5 коротких релевантных хештегов по этому сообщению. Только сами хештеги без #, через запятую. На русском, без пробелов внутри одного тега.',
            prompt: firstText,
          });

          const tags = String(text)
            .split(/[,\n]/)
            .map((s) => s.trim().replace(/^#/, ''))
            .filter(Boolean)
            .slice(0, 5)
            .map((s) => s.toLowerCase());

          if (tags.length > 0) {
            await setChatHashtags({ chatId, hashtags: tags });
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to generate hashtags:', e);
  }

  return updated;
}

export async function createNewChat({
  modelId,
}: {
  modelId: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const id = generateUUID();
  const title = 'Новый чат';

  await saveChat({
    id,
    userId: session.user.id,
    title,
  });

  return { id };
}
