import { saveMessages } from '@/lib/db/queries';

export async function POST(request: Request) {
  const { chatId, message } = await request.json();
  console.log('[API/message] Incoming payload:', { chatId, message });

  // Normalize message into parts: prefer content (string or blocks), fallback to parts
  const contentFromBlocks = Array.isArray(message?.content)
    ? message.content
        .filter((b: any) => b && b.type === 'text' && typeof b.text === 'string')
        .map((b: any) => b.text)
        .join('\n\n')
    : '';
  const contentFromParts = Array.isArray(message?.parts)
    ? message.parts
        .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('\n\n')
    : '';
  const normalizedText: string =
    typeof message?.content === 'string'
      ? message.content
      : contentFromBlocks || contentFromParts;

  const normalizedParts = normalizedText
    ? [{ type: 'text', text: normalizedText }]
    : Array.isArray(message?.parts)
      ? message.parts.filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      : [];

  if (!normalizedParts.length) {
    console.warn('[API/message] Skipping save: no text content derived from message');
    return Response.json({ success: true, skipped: true });
  }

  try {
    await saveMessages({
      messages: [
        {
          chatId,
          id: message.id,
          role: message.role,
          parts: normalizedParts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });
    console.log('[API/message] Message saved successfully');
  } catch (error) {
    console.error('Error saving message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
