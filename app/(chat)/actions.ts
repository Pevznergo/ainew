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
  checkFirstShare,
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
  console.log('updateChatVisibility called with:', { chatId, visibility });
  const updated = await updateChatVisiblityById({ chatId, visibility });

  // Check for first share completion when chat is made public
  if (visibility === 'public') {
    const session = await auth();
    if (session?.user?.id) {
      try {
        await checkFirstShare(session.user.id);
      } catch (error) {
        console.error('Error checking first share completion:', error);
        // Don't fail the visibility update if task checking fails
      }
    }
  }

  try {
    if (visibility === 'public') {
      const chat = await getChatById({ id: chatId });
      const existing = (chat as any)?.hashtags as string[] | undefined;
      if (!existing || existing.length === 0) {
        console.log('Starting hashtag generation for chat:', chatId);
        const firstMsg = await getFirstUserMessageByChatId({ chatId });
        console.log('First message raw:', JSON.stringify(firstMsg, null, 2));

        let firstText = '';

        // Try different ways to extract text from the message
        if (firstMsg) {
          // Case 1: Check if parts is an array with text content
          if (Array.isArray(firstMsg.parts)) {
            for (const p of firstMsg.parts) {
              if (
                p?.type === 'text' &&
                typeof p.text === 'string' &&
                p.text.trim()
              ) {
                firstText = p.text.trim();
                console.log('Found text in parts:', firstText);
                break;
              }
            }
          }

          // Case 2: Check if there's a single text part in the message
          if (
            !firstText &&
            Array.isArray(firstMsg.parts) &&
            firstMsg.parts.length === 1 &&
            firstMsg.parts[0]?.type === 'text' &&
            typeof firstMsg.parts[0]?.text === 'string'
          ) {
            firstText = firstMsg.parts[0].text.trim();
            console.log('Found text in single part:', firstText);
          }

          // Case 3: Check if message has a data field with content
          if (
            !firstText &&
            typeof (firstMsg as any)?.data?.content === 'string'
          ) {
            firstText = (firstMsg as any).data.content.trim();
            console.log('Found text in data.content:', firstText);
          }
        }

        if (firstText) {
          try {
            const { text } = await generateText({
              model: openai('gpt-4o-mini-2024-07-18'),
              system:
                'Generate exactly 5 single English words that best describe the main topics of this message. Each word must be 3-12 characters long, lowercase, and contain only English letters a-z. Separate words with commas, no other symbols. Example output: economy,games,money,investments,strategies. Do not include any special characters, numbers, or symbols in the output. Always respond in English, even if the input is in another language.',
              prompt: firstText,
            });

            const tags = String(text)
              .split(/[,\n]/)
              .map((s) => s.trim().replace(/^#/, '').toLowerCase())
              .filter((s) => /^[a-z]{3,12}$/.test(s)) // Only keep English words with 3-12 letters
              .slice(0, 5);

            if (tags.length > 0) {
              await setChatHashtags({ chatId, hashtags: tags });
              // Tags saved successfully
            }
          } catch (error) {
            console.error('Error generating hashtags:', error);
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
