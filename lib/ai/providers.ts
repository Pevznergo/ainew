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

export function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-')) return openai;
  if (modelId.startsWith('Claude')) return anthropic;
  if (modelId.startsWith('Gemini')) return google;
  if (modelId.startsWith('DeepSeek')) return deepseek;
  if (modelId.startsWith('Grok')) return xai;
  throw new Error(`Unknown provider for modelId: ${modelId}`);
}
