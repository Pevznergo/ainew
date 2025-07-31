'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  saveChat,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { openai } from '@ai-sdk/openai';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/app/(auth)/auth';

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
  await updateChatVisiblityById({ chatId, visibility });
}

export async function createNewChat({
  modelId,
  visibility = 'private',
}: {
  modelId: string;
  visibility?: VisibilityType;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const id = generateUUID();
  const title = 'Новый чат'; // Можно сделать умнее, если нужно

  await saveChat({
    id,
    userId: session.user.id,
    title,
    visibility,
  });

  return { id };
}
