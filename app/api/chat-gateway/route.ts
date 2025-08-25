import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

const providerMap = {
  openai,
  anthropic,
  google,
  xai,
};

function getProviderByModelId(modelId: string) {
  if (modelId.startsWith('gpt-4o-mini-2024-07-18')) return openai(modelId);
  if (modelId.startsWith('gpt-5-mini')) return openai(modelId);
  if (modelId.startsWith('gpt-5-chat')) return openai(modelId);
  if (modelId.startsWith('gpt-4.1-2025-04-14')) return openai(modelId);
  if (modelId.startsWith('o3-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('o3-mini-2025-01-31')) return openai(modelId);
  if (modelId.startsWith('o1-mini-2024-09-12')) return openai(modelId);
  if (modelId.startsWith('o4-mini-2025-04-16')) return openai(modelId);
  if (modelId.startsWith('claude-sonnet-4-20250514')) return anthropic(modelId);
  if (modelId.startsWith('claude-3-7-sonnet-20250219'))
    return anthropic(modelId);
  if (modelId.startsWith('gemini-2.5-pro')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash')) return google(modelId);
  if (modelId.startsWith('gemini-2.5-flash-lite')) return google(modelId);
  if (modelId.startsWith('grok-3')) return xai(modelId);
  if (modelId.startsWith('grok-3-mini')) return xai(modelId);
  throw new Error(`Unknown provider for modelId: ${modelId}`);
}

export async function POST(req: Request) {
  const model = req.headers.get('X-Model') || 'gpt-4o-mini-2024-07-18';
  const { messages } = await req.json();

  const aiModel = getProviderByModelId(model);

  const result = streamText({
    model: aiModel as any,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
