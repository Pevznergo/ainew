import { NextResponse } from 'next/server';
import { and, eq, asc } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { db, getChatById, voteMessage } from '@/lib/db/queries';
import { repost, message } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const originalChatId = String(body?.chatId || '').trim();
    if (!originalChatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 },
      );
    }

    // Validate original chat exists and is public
    const original = await getChatById({ id: originalChatId });
    if (!original) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (String(original.visibility) !== 'public') {
      return NextResponse.json(
        { error: 'Chat is not public' },
        { status: 403 },
      );
    }

    // Prevent users from reposting their own content
    if (original.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot repost your own content' },
        { status: 400 },
      );
    }

    // Prevent duplicate reposts by same user
    const existing = await db
      .select()
      .from(repost)
      .where(
        and(
          eq(repost.chatId, originalChatId),
          eq(repost.userId, session.user.id),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already reposted' }, { status: 409 });
    }

    // Insert repost record (no longer creating duplicate chat)
    await db
      .insert(repost)
      .values({ chatId: originalChatId, userId: session.user.id } as any)
      .onConflictDoNothing();

    // Automatically like the original post when reposting
    try {
      // Get the first message from the original chat for voting
      const originalMessages = await db
        .select({ id: message.id })
        .from(message)
        .where(
          and(eq(message.chatId, originalChatId), eq(message.role, 'user')),
        )
        .orderBy(asc(message.createdAt))
        .limit(1);

      if (originalMessages.length > 0) {
        const firstMessageId = originalMessages[0].id;
        await voteMessage({
          chatId: originalChatId,
          messageId: firstMessageId,
          userId: session.user.id,
          type: 'up',
        });
      }
    } catch (voteError) {
      // Log the error but don't fail the repost if voting fails
      console.error('Failed to auto-like during repost:', voteError);
    }

    return NextResponse.json({ ok: true, chatId: originalChatId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Repost failed' },
      { status: 400 },
    );
  }
}
