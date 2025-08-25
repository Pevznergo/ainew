import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel, ImageModel } from './models';
import { chatModels, imageModels } from './models';
import type { User } from '@/lib/db/schema';
import { decrementUserBalance } from '@/lib/db/server-queries';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
  availableImageModelIds: Array<ImageModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 3,
    availableChatModelIds: [
      'gpt-4o-mini-2024-07-18',
      'openai/gpt-5-mini',
      'openai/gpt-5-chat',
      'qwen/qwen3-235b-a22b-2507',
      'z-ai/glm-4.5-air:free',
      'mistralai/mistral-medium-3.1',
      'minimax/minimax-m1',
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
      'x-ai/grok-4',
    ],
    availableImageModelIds: [
      'gpt_image_2022-09-12',
      'dalle3',
      'flux_1.1_pro',
      'midjourney',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      'gpt-4o-mini-2024-07-18',
      'openai/gpt-5-mini',
      'openai/gpt-5-chat',
      'qwen/qwen3-235b-a22b-2507',
      'z-ai/glm-4.5-air:free',
      'mistralai/mistral-medium-3.1',
      'minimax/minimax-m1',
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
      'x-ai/grok-4',
    ],
    availableImageModelIds: [
      'gpt_image_2022-09-12',
      'dalle3',
      'flux_1.1_pro',
      'midjourney',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

export async function checkUserEntitlements(user: User, modelId: string) {
  // Проверяем, является ли модель чат-моделью или моделью изображений
  const chatModel = chatModels.find((m) => m.id === modelId);
  const imageModel = imageModels.find((m) => m.id === modelId);

  if (!chatModel && !imageModel) {
    throw new Error('Модель не найдена');
  }

  const model = chatModel || imageModel;
  console.log('Model cost:', model.cost, 'User balance:', user.balance);

  // Если модель бесплатная, не проверяем баланс
  if (model.cost === 0) {
    return true;
  }

  if (user.balance < model.cost) {
    throw new Error(
      `Недостаточно токенов. Необходимо: ${model.cost}, доступно: ${user.balance}. Пополните баланс в профиле`,
    );
  }

  // Уменьшаем баланс пользователя только для платных моделей
  await decrementUserBalance(user.id, model.cost);
  console.log('Balance decremented successfully');

  return true;
}
