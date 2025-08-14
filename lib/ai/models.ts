export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini-2024-07-18';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  cost: number; // Added cost field
}

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  cost: number;
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
    name: 'GPT-4.1 (10 токенов/запрос)',
    cost: 10, // Added cost field
    description: 'Самая популярная модель от OpenAI',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini (бесплатно)',
    cost: 0,
    description: 'Быстрая, компактная, умная, гибкая, разговорная.',
  },
  {
    id: 'openai/gpt-5-chat',
    name: 'GPT-5 Chat (60 токенов/запрос)',
    cost: 60, // Added cost field
    description: 'Мощная, контекстная, точная, адаптивная.',
  },
  // OpenRouter community models (бесплатно)
  {
    id: 'qwen/qwen3-235b-a22b-2507',
    name: 'Qwen3 235B (бесплатно)',
    cost: 0,
    description: 'Qwen3 235B — мощная модель от Qwen.',
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM-4.5 Air (бесплатно)',
    cost: 0,
    description: 'GLM-4.5 Air — бесплатная модель Zhipu AI.',
  },
  {
    id: 'mistralai/mistral-medium-3.1',
    name: 'Mistral Medium 3.1 (бесплатно)',
    cost: 0,
    description: 'Средняя модель от Mistral AI, доступна.',
  },
  {
    id: 'minimax/minimax-m1',
    name: 'MiniMax M1 (бесплатно)',
    cost: 0,
    description: 'MiniMax M1 — бесплатная модель.',
  },
  {
    id: 'o3-2025-04-16',
    name: 'GPT o3 2025 (50 токенов/запрос)',
    cost: 50, // Added cost field
    description:
      'Самая передовая модель. Логично анализирует и предлагает комплексные решения',
  },
  {
    id: 'o3-mini-2025-01-31',
    name: 'GPT o3-mini-high (50 токенов/запрос)',
    cost: 50, // Added cost field
    description:
      'Самая передовая модель. Заточена под решение задач и программирование',
  },
  {
    id: 'o1-mini-2024-09-12',
    name: 'GPT o1-mini (30 токенов/запрос)',
    cost: 30, // Added cost field
    description:
      'Быстрая и экономичная. Умеет рассуждать, решать сложные задачи. Идеальна для кодирования и математики',
  },
  {
    id: 'o4-mini-2025-04-16',
    name: 'GPT o4-mini (20 токенов/запрос)',
    cost: 20, // Added cost field
    description: 'Размышляющая модель от OpenAI. Лучшая для кодирования',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4 (100 токенов/запрос)',
    cost: 100, // Added cost field
    description: 'Рассуждающая модель от Anthropic',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (100 токенов/запрос)',
    cost: 100, // Added cost field
    description: 'Размышляющая модель от Anthropic',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 PRO (30 токенов/запрос)',
    cost: 30, // Added cost field
    description: 'Сбалансированная рассуждающая модель от Google',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (5 токенов/запрос)',
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
    name: 'Grok 3 (20 токенов/запрос)',
    cost: 20, // Added cost field
    description: 'Быстрая модель от xAI',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini (10 токенов/запрос)',
    cost: 10, // Added cost field
    description: 'Быстрая модель от xAI',
  },
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4 (50 токенов/запрос)',
    cost: 50,
    description: 'Новейшая модель от xAI через OpenRouter',
  },
];

export const imageModels: ImageModel[] = [
  {
    id: 'gpt_image_2022-09-12',
    name: 'GPT Image 1',
    description:
      'Умная модель, которая быстро и точно создает картинки по вашему описанию, особенно хорошо рисует надписи и мелкие детали.',
    cost: 50,
  },
  {
    id: 'dalle3',
    name: 'Midjourney',
    description:
      'Мощная модель от OpenAI. Отличается точной интерпретацией текстовых запросов и способна генерировать как фотореалистичные, так и стилизованные изображения.',
    cost: 50,
  },
  {
    id: 'flux_1.1_pro',
    name: 'Flux-1.1 Pro',
    description:
      'Профессиональная модель. Фотореалистичность, точность воспроизведения текстур и сложных композиций',
    cost: 50,
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description:
      'Высококачественная модель. Известна своим уникальным художественным стилем, создавая атмосферные и детализированные образы.',
    cost: 100,
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

export function getImageModelById(id: string): ImageModel {
  const model = imageModels.find((model) => model.id === id);
  if (!model) {
    throw new Error(`Image model with id ${id} not found`);
  }
  return model;
}
