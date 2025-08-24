import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { db, getChatById, getMessagesByChatId, saveChat, saveMessages } from '@/lib/db/queries';
import { repost } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const originalChatId = String(body?.chatId || '').trim();
    if (!originalChatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    // Validate original chat exists and is public
    const original = await getChatById({ id: originalChatId });
    if (!original) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (String(original.visibility) !== 'public') {
      return NextResponse.json({ error: 'Chat is not public' }, { status: 403 });
    }

    // Prevent duplicate reposts by same user
    const existing = await db
      .select()
      .from(repost)
      .where(and(eq(repost.chatId, originalChatId), eq(repost.userId, session.user.id)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already reposted' }, { status: 409 });
    }

    // Create new chat for the reposting user
    const newChatId = generateUUID();
    const title = String(original.title || '').trim() || 'Репост';
    await saveChat({ id: newChatId, userId: session.user.id, title, visibility: 'public' });

    // Copy messages from original chat to new chat
    const originalMessages = await getMessagesByChatId({ id: originalChatId });
    if (Array.isArray(originalMessages) && originalMessages.length > 0) {
      const cloned = originalMessages.map((m) => ({
        id: generateUUID(),
        role: m.role as 'user' | 'assistant',
        parts: (m as any).parts,
        attachments: (m as any).attachments || [],
        createdAt: (m as any).createdAt,
        chatId: newChatId,
      }));
      await saveMessages({ messages: cloned });
    }

    // Insert repost record
    await db
      .insert(repost)
      .values({ chatId: originalChatId, userId: session.user.id } as any)
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, newChatId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Repost failed' }, { status: 400 });
  }
}
