import { saveMessages } from '@/lib/db/queries';

export async function POST(request: Request) {
  const { chatId, message } = await request.json();
  console.log('Saving message:', { chatId, message });

  try {
    await saveMessages({
      messages: [
        {
          chatId,
          id: message.id,
          role: message.role,
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });
    console.log('Message saved successfully');
  } catch (error) {
    console.error('Error saving message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
