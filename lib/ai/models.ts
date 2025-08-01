export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini-2024-07-18';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  cost: number; // Added cost field
}

export const chatModels: ChatModel[] = [
  {
    id: 'gpt-4o-mini-2024-07-18',
    name: 'GPT-4o Mini (бесплатно)',
    cost: 0,
    description:
      'Быстрая и умная модель. Отлично справляется с бытовыми задачами. Может допускать ошибки',
  },
  {
    id: 'gpt-4.1-2025-04-14',
    name: 'GPT-4.1 (10 монет/запрос)',
    cost: 10, // Added cost field
    description: 'Самая популярная модель от OpenAI',
  },
  {
    id: 'o3-2025-04-16',
    name: 'GPT o3 2025 (50 монет/запрос)',
    cost: 50, // Added cost field
    description:
      'Самая передовая модель. Логично анализирует и предлагает комплексные решения',
  },
  {
    id: 'o3-mini-2025-01-31',
    name: 'GPT o3-mini-high (50 монет/запрос)',
    cost: 50, // Added cost field
    description:
      'Самая передовая модель. Заточена под решение задач и программирование',
  },
  {
    id: 'o1-mini-2024-09-12',
    name: 'GPT o1-mini (30 монет/запрос)',
    cost: 30, // Added cost field
    description:
      'Быстрая и экономичная. Умеет рассуждать, решать сложные задачи. Идеальна для кодирования и математики',
  },
  {
    id: 'o4-mini-2025-04-16',
    name: 'GPT o4-mini (20 монет/запрос)',
    cost: 20, // Added cost field
    description: 'Размышляющая модель от OpenAI. Лучшая для кодирования',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4 (100 монет/запрос)',
    cost: 100, // Added cost field
    description: 'Рассуждающая модель от Anthropic',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (100 монет/запрос)',
    cost: 100, // Added cost field
    description: 'Размышляющая модель от Anthropic',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 PRO (30 монет/запрос)',
    cost: 30, // Added cost field
    description: 'Сбалансированная рассуждающая модель от Google',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (5 монет/запрос)',
    cost: 5, // Added cost field
    description: 'Быстро размышляющая модель от Google',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite (Бесплатно)',
    cost: 0, // Added cost field
    description: 'Сверхбыстрая модель от Google',
  },
  {
    id: 'grok-3',
    name: 'Grok 3 (20 монет/запрос)',
    cost: 20, // Added cost field
    description: 'Быстрая модель от xAI',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini (10 монет/запрос)',
    cost: 10, // Added cost field
    description: 'Быстрая модель от xAI',
  },
];

export { chatModels as models };

export function getModelById(id: string): ChatModel {
  const model = chatModels.find((model) => model.id === id);
  if (!model) {
    throw new Error(`Model with id ${id} not found`);
  }
  return model;
}
