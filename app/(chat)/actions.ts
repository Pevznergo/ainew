'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  saveChat,
  getUserReferralCode,
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
  return await updateChatVisiblityById({ chatId, visibility });
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
