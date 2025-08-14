import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ChatTools = {
  getWeather: typeof getWeather;
  createDocument: typeof createDocument;
  updateDocument: typeof updateDocument;
  requestSuggestions: typeof requestSuggestions;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
};

// UIMessage<Metadata, DataTypes>
export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export function sendGTMEvent(
  eventName: string,
  parameters: Record<string, any> = {},
) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}
