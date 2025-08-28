import { NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, lt, count } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { chat, message, vote, user, repost } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

function extractTextFromParts(parts: any): string {
  if (!Array.isArray(parts)) return '';
  for (const p of parts) {
    if (p?.type === 'text' && typeof p.text === 'string' && p.text.trim()) {
      return p.text.trim();
    }
  }
  return '';
}

function extractFirstImageUrl(msg: any): string | null {
  const parts = Array.isArray(msg?.parts) ? msg.parts : [];
  for (const p of parts) {
    if (p?.type === 'image' && typeof p.imageUrl === 'string' && p.imageUrl) {
      return p.imageUrl;
    }
  }
  const atts = Array.isArray(msg?.attachments) ? msg.attachments : [];
  for (const a of atts) {
    if (a?.type === 'image' && typeof a.url === 'string' && a.url) {
      return a.url;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const before = searchParams.get('before');
  const sortParam = searchParams.get('sort');
  const limitParam = searchParams.get('limit');
  const tag = (searchParams.get('tag') || '').toLowerCase().trim();
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const LIMIT = Math.min(Math.max(Number(limitParam) || 50, 1), 100);
  const sort: 'rating' | 'date' = sortParam === 'date' ? 'date' : 'rating';

  const beforeDate = before ? new Date(before) : null;

  // Get user's original chats
  const myChats = await db
    .select({
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title,
      userId: chat.userId,
      visibility: chat.visibility,
      hashtags: chat.hashtags as any,
    })
    .from(chat)
    .where(
      beforeDate
        ? and(eq(chat.userId, session.user.id), lt(chat.createdAt, beforeDate))
        : eq(chat.userId, session.user.id),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  // Get user's reposts
  const myReposts = await db
    .select({
      id: chat.id,
      createdAt: repost.createdAt, // Use repost time for sorting
      title: chat.title,
      userId: chat.userId, // Original author
      visibility: chat.visibility,
      hashtags: chat.hashtags as any,
      originalChatId: chat.id,
      originalAuthorId: chat.userId,
      repostedBy: repost.userId, // Who reposted it (should be session.user.id)
    })
    .from(repost)
    .innerJoin(chat, eq(repost.chatId, chat.id))
    .where(
      beforeDate
        ? and(
            eq(repost.userId, session.user.id),
            eq(chat.visibility, 'public'),
            lt(repost.createdAt, beforeDate),
          )
        : and(
            eq(repost.userId, session.user.id),
            eq(chat.visibility, 'public'),
          ),
    )
    .orderBy(desc(repost.createdAt))
    .limit(LIMIT);

  // Combine and sort all user activity (original posts + reposts)
  const allUserActivity = [
    ...myChats.map((chat) => ({
      ...chat,
      isRepost: false as const,
      repostedBy: null as string | null,
    })),
    ...myReposts.map((item) => ({ ...item, isRepost: true as const })),
  ];
  allUserActivity.sort(
    (a, b) =>
      new Date(b.createdAt as any).getTime() -
      new Date(a.createdAt as any).getTime(),
  );
  const userActivity = allUserActivity.slice(0, LIMIT);

  if (!userActivity || userActivity.length === 0) {
    return NextResponse.json({ items: [], nextBefore: null });
  }

  // Get all chat IDs for messages (use original chat ID for reposts)
  const chatIds = userActivity.map((c) =>
    c.isRepost ? (c.originalChatId as string) || c.id : c.id,
  );

  const msgs = await db
    .select()
    .from(message)
    .where(
      and(
        inArray(message.chatId, chatIds as string[]),
        eq(message.role, 'user'),
      ),
    )
    .orderBy(asc(message.createdAt));

  const firstMsgByChat = new Map<string, (typeof msgs)[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(
      m.chatId,
      (userMsgCountByChat.get(m.chatId) ?? 0) + 1,
    );
  }

  let filtered = userActivity;
  if (tag) {
    filtered = filtered.filter(
      (c: any) =>
        Array.isArray(c?.hashtags) &&
        c.hashtags.some((t: string) => String(t).toLowerCase() === tag),
    );
  }
  if (q) {
    const qlc = q;
    filtered = filtered.filter((c: any) => {
      const chatId = c.isRepost ? (c.originalChatId as string) || c.id : c.id;
      const first = firstMsgByChat.get(chatId);
      const body = first
        ? extractTextFromParts((first as any).parts).toLowerCase()
        : '';
      const title = String((c as any).title || '').toLowerCase();
      const tags = Array.isArray((c as any).hashtags)
        ? ((c as any).hashtags as string[])
        : [];
      return (
        body.includes(qlc) ||
        title.includes(qlc) ||
        tags.some((t) =>
          String(t || '')
            .toLowerCase()
            .includes(qlc),
        )
      );
    });
  }

  const filteredChatIds = filtered.map((c) =>
    c.isRepost ? (c.originalChatId as string) || c.id : c.id,
  );
  const voteRows = await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(
      and(
        inArray(vote.chatId, filteredChatIds as string[]),
        eq(vote.isUpvoted, true),
      ),
    )
    .groupBy(vote.chatId);
  const upvotesByChat = new Map<string, number>(
    voteRows.map((v) => [v.chatId, Number(v.upvotes)]),
  );

  const repostRows = await db
    .select({ chatId: repost.chatId, reposts: count(repost.userId) })
    .from(repost)
    .where(inArray(repost.chatId, filteredChatIds as string[]))
    .groupBy(repost.chatId);
  const repostsByChat = new Map<string, number>(
    repostRows.map((r) => [r.chatId, Number(r.reposts)]),
  );

  const chatsForRender = (() => {
    if (sort === 'rating') {
      return [...filtered].sort((a, b) => {
        const chatIdA = a.isRepost
          ? (a.originalChatId as string) || a.id
          : a.id;
        const chatIdB = b.isRepost
          ? (b.originalChatId as string) || b.id
          : b.id;
        const ua = upvotesByChat.get(chatIdA) ?? 0;
        const ub = upvotesByChat.get(chatIdB) ?? 0;
        if (ub !== ua) return ub - ua;
        return (
          new Date(b.createdAt as any).getTime() -
          new Date(a.createdAt as any).getTime()
        );
      });
    }
    return filtered;
  })();

  const authorMap = new Map<
    string,
    { id: string; email: string | null; nickname: string | null }
  >();

  // Load current user
  const me = await db
    .select({ id: user.id, email: user.email, nickname: user.nickname as any })
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((rows) => rows[0]);
  if (me) authorMap.set(me.id as any, me as any);

  // Load original authors for reposts
  const originalAuthorIds = Array.from(
    new Set(
      filtered
        .filter(
          (c): c is typeof c & { isRepost: true; originalAuthorId: string } =>
            c.isRepost &&
            'originalAuthorId' in c &&
            Boolean(c.originalAuthorId),
        )
        .map((c) => c.originalAuthorId),
    ),
  );

  if (originalAuthorIds.length > 0) {
    const originalAuthors = await db
      .select({
        id: user.id,
        email: user.email,
        nickname: user.nickname as any,
      })
      .from(user)
      .where(inArray(user.id, originalAuthorIds));

    for (const author of originalAuthors) {
      authorMap.set(author.id as any, author as any);
    }
  }

  const items = chatsForRender.map((c: any) => {
    const chatId = c.isRepost ? (c.originalChatId as string) || c.id : c.id;
    const first = firstMsgByChat.get(chatId);
    const text = first ? extractTextFromParts(first.parts as any) : '';
    const imageUrl = first ? extractFirstImageUrl(first) : null;
    const upvotes = upvotesByChat.get(chatId) ?? 0;
    const rp = repostsByChat.get(chatId) ?? 0;
    // For reposts, use original author; for regular posts, use the post author
    const authorId =
      c.isRepost && 'originalAuthorId' in c && c.originalAuthorId
        ? (c as any).originalAuthorId
        : c.userId;
    const au = authorMap.get(authorId as any) as any;
    const author = au
      ? String(au.nickname || '').trim() ||
        String(au.email || '').trim() ||
        'Пользователь'
      : 'Пользователь';

    // For reposts, get the reposter info (current user)
    const reposterInfo = c.isRepost
      ? (authorMap.get(session.user.id as any) as any)
      : null;
    const repostedBy = reposterInfo
      ? String(reposterInfo.nickname || '').trim() ||
        String(reposterInfo.email || '').trim() ||
        'Пользователь'
      : null;

    return {
      chatId,
      firstMessageId: first?.id ?? null,
      createdAt:
        (c.createdAt as any)?.toISOString?.() ??
        new Date(c.createdAt as any).toISOString(),
      text,
      imageUrl,
      upvotes,
      reposts: rp,
      commentsCount: Math.max(
        0,
        (userMsgCountByChat.get(chatId) ?? 0) - (first ? 1 : 0),
      ),
      hashtags: Array.isArray((c as any).hashtags) ? (c as any).hashtags : [],
      author,
      isRepost: c.isRepost || false,
      repostedBy,
      repostedByHref: c.isRepost ? null : null, // We'd need to compute this properly
    };
  });

  const hasMore = userActivity.length === LIMIT;
  const lastCreatedAt = userActivity[userActivity.length - 1]?.createdAt as any;
  const nextBefore =
    hasMore && lastCreatedAt ? new Date(lastCreatedAt).toISOString() : null;

  return NextResponse.json({ items, nextBefore });
}
