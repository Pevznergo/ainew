
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment;

// Providers - API keys are automatically loaded from environment
export const openaiProvider = openai;
export const anthropicProvider = anthropic;
export const googleProvider = google;
export const deepseekProvider = deepseek;
export const xaiProvider = xai;
export const openrouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.APP_ORIGIN || '',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Ainew',
  },
});

export function getProviderByModelId(modelId: string) {
  // Любая namespaced-модель (vendor/model) идёт через OpenRouter
  if (modelId.includes('/')) return openrouterProvider.chat(modelId);
  if (modelId.startsWith('gpt-')) return openai;
  if (modelId.startsWith('claude-')) return anthropic;
  if (modelId.startsWith('gemini-')) return google;
  if (modelId.startsWith('deepseek-')) return deepseek;
  if (modelId.startsWith('grok-')) return xai;

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3') return openai;
  if (modelId === 'flux_1.1_pro') return openrouterProvider.chat(modelId);
  if (modelId === 'midjourney') return openrouterProvider.chat(modelId);

  throw new Error(`Unknown provider for modelId: ${modelId}`);
}

// Отдельная функция для артефактов, которая всегда возвращает LanguageModelV2
export function getArtifactModel(modelId: string) {
  if (modelId.includes('/')) return openrouterProvider.chat(modelId);
  if (modelId.startsWith('gpt-')) return openai.languageModel(modelId);
  if (modelId.startsWith('claude-')) return anthropic.languageModel(modelId);
  if (modelId.startsWith('gemini-')) return google.languageModel(modelId);
  if (modelId.startsWith('deepseek-')) return deepseek.languageModel(modelId);
  if (modelId.startsWith('grok-')) return xai.languageModel(modelId);

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3')
    return openai.languageModel(modelId);
  if (modelId === 'flux_1.1_pro') return openrouterProvider.chat(modelId);
  if (modelId === 'midjourney') return openrouterProvider.chat(modelId);

  throw new Error(`Unknown provider for modelId: ${modelId}`);
}

// Отдельная функция для изображений
export function getImageModel(modelId: string) {
  if (modelId.startsWith('gpt-')) return openai.imageModel(modelId);
  if (modelId.startsWith('claude-')) return anthropic.imageModel(modelId);
  if (modelId.startsWith('gemini-')) return google.imageModel(modelId);
  if (modelId.startsWith('deepseek-')) return deepseek.imageModel(modelId);
  if (modelId.startsWith('grok-')) return xai.imageModel(modelId);
  if (modelId.startsWith('x-ai/')) return openrouterProvider.chat(modelId);

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3')
    return openai.imageModel(modelId);
  if (modelId === 'flux_1.1_pro') return openrouterProvider.chat(modelId);
  if (modelId === 'midjourney') return openrouterProvider.chat(modelId);

  throw new Error(`Unknown provider for modelId: ${modelId}`);
}
