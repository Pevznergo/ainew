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

// Кастомный провайдер для OpenRouter
export const openrouterProvider = customProvider({
  id: 'openrouter',
  async callApi({ messages, model, temperature, maxTokens, stream }) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://aporto.tech',
        'X-Title': 'AI Chat',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return response;
  },
});

export function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-')) return openai;
  if (modelId.startsWith('claude-')) return anthropic;
  if (modelId.startsWith('gemini-')) return google;
  if (modelId.startsWith('deepseek-')) return deepseek;
  if (modelId.startsWith('grok-')) return xai;
  if (modelId.startsWith('x-ai/')) return openrouterProvider;
  throw new Error(`Unknown provider for modelId: ${modelId}`);
}
