import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';
import { chatModels } from './models';
import type { User } from '@/lib/db/schema';
import { guestRegex } from '@/lib/constants';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 3,
    availableChatModelIds: [
      'gpt-4o-mini-2024-07-18',
      'gpt-4o',
      'gpt-4.1-2025-04-14',
      'o3-2025-04-16',
      'o3-mini-2025-01-31',
      'o1-mini-2024-09-12',
      'o4-mini-2025-04-16',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'grok-3',
      'grok-3-mini',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      'gpt-4o-mini-2024-07-18',
      'gpt-4o',
      'gpt-4.1-2025-04-14',
      'o3-2025-04-16',
      'o3-mini-2025-01-31',
      'o1-mini-2024-09-12',
      'o4-mini-2025-04-16',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'grok-3',
      'grok-3-mini',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
export async function checkUserEntitlements(user: User, modelId: string) {
  // Проверяем, является ли пользователь гостем
  const isGuest = guestRegex.test(user.email);

  if (isGuest) {
    // Для гостей не проверяем лимит здесь - это делается в API
    // Лимит проверяется в app/(chat)/api/chat/route.ts
    return true;
  }

  // Проверяем баланс для зарегистрированных пользователей
  const chatModel = chatModels.find((m) => m.id === modelId);
  if (!chatModel) {
    throw new Error('Модель не найдена');
  }

  if (user.balance < chatModel.cost) {
    throw new Error(
      `Недостаточно монет. Необходимо: ${chatModel.cost}, доступно: ${user.balance}`,
    );
  }

  return true;
}
