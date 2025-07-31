export function getResponseChunksByPrompt(
  prompt: string,
  includeReasoningStep?: boolean,
): Array<{ type: string; text: string }> {
  // Mock implementation for testing
  const baseChunks = [{ type: 'text', text: `Response to: ${prompt}` }];

  if (includeReasoningStep) {
    return [
      { type: 'reasoning', text: 'Thinking about the response...' },
      ...baseChunks,
    ];
  }

  return baseChunks;
}
