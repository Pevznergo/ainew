import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
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
});

export function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-')) return openai;
  if (modelId.startsWith('claude-')) return anthropic;
  if (modelId.startsWith('gemini-')) return google;
  if (modelId.startsWith('deepseek-')) return deepseek;
  if (modelId.startsWith('grok-')) return xai;
  if (modelId.startsWith('x-ai/')) return openrouterProvider.chat(modelId);

  // Для моделей изображений
  if (modelId === 'gpt_image_2022-09-12' || modelId === 'dalle3') return openai;
  if (modelId === 'flux_1.1_pro') return openrouterProvider.chat(modelId);
  if (modelId === 'midjourney') return openrouterProvider.chat(modelId);

  throw new Error(`Unknown provider for modelId: ${modelId}`);
}

// Отдельная функция для артефактов, которая всегда возвращает LanguageModelV2
export function getArtifactModel(modelId: string) {
  if (modelId.startsWith('gpt-')) return openai.languageModel(modelId);
  if (modelId.startsWith('claude-')) return anthropic.languageModel(modelId);
  if (modelId.startsWith('gemini-')) return google.languageModel(modelId);
  if (modelId.startsWith('deepseek-')) return deepseek.languageModel(modelId);
  if (modelId.startsWith('grok-')) return xai.languageModel(modelId);
  if (modelId.startsWith('x-ai/')) return openrouterProvider.chat(modelId);

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
