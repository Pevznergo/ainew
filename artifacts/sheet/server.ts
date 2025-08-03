import { z } from 'zod';
import { streamObject } from 'ai';
import { getArtifactModel } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getArtifactModel('artifact-model') as any,
      system: sheetPrompt,
      prompt: title,
      schema: z.object({
        sheet: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { sheet } = object;

        if (sheet) {
          dataStream.write({
            type: 'data-sheetDelta',
            data: sheet ?? '',
          });

          draftContent = sheet;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getArtifactModel('artifact-model') as any,
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        sheet: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { sheet } = object;

        if (sheet) {
          dataStream.write({
            type: 'data-sheetDelta',
            data: sheet ?? '',
          });

          draftContent = sheet;
        }
      }
    }

    return draftContent;
  },
});
