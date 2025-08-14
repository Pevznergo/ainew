export function getResponseChunksByPrompt(
  prompt: unknown,
  _includeReasoningStep?: boolean,
): any[] {
  const promptText =
    typeof prompt === 'string' ? prompt : JSON.stringify(prompt ?? '');

  // Return a minimal valid LanguageModelV2 stream sequence
  return [
    { id: '1', type: 'text-start' },
    { id: '1', type: 'text-delta', delta: `Response to: ${promptText}` },
    { id: '1', type: 'text-end' },
    {
      type: 'finish',
      finishReason: 'stop',
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    },
  ];
}
