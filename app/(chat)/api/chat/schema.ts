import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum([
    'gpt-4o-mini-2024-07-18',
    'gpt-5-mini',
    'gpt-5-chat',
    'gpt-4.1-2025-04-14',
    'o3-2025-04-16',
    'o3-mini-2025-01-31',
    'o1-mini-2024-09-12',
    'o4-mini-2025-04-16',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'grok-3',
    'grok-3-mini',
  ]),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
