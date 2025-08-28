import { NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, lt, count } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { chat, message, vote, user, repost } from '@/lib/db/schema';
import { getUserChannelPath } from '@/lib/paths';

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
  const { searchParams } = new URL(request.url);
  const before = searchParams.get('before');
  const sortParam = searchParams.get('sort');
  const limitParam = searchParams.get('limit');
  const tag = (searchParams.get('tag') || '').toLowerCase().trim();
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const LIMIT = Math.min(Math.max(Number(limitParam) || 50, 1), 100);
  const sort: 'rating' | 'date' = sortParam === 'date' ? 'date' : 'rating';

  const beforeDate = before ? new Date(before) : null;

  // Get original public chats
  const publicChats = await db
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
        ? and(eq(chat.visibility, 'public'), lt(chat.createdAt, beforeDate))
        : eq(chat.visibility, 'public'),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  // Get recent reposts as feed items
  const repostItems = await db
    .select({
      id: chat.id,
      createdAt: repost.createdAt, // Use repost time for sorting
      title: chat.title,
      userId: chat.userId, // Original author
      visibility: chat.visibility,
      hashtags: chat.hashtags as any,
      originalChatId: chat.id,
      originalAuthorId: chat.userId,
      repostedBy: repost.userId, // Who reposted it
    })
    .from(repost)
    .innerJoin(chat, eq(repost.chatId, chat.id))
    .where(
      beforeDate
        ? and(eq(chat.visibility, 'public'), lt(repost.createdAt, beforeDate))
        : eq(chat.visibility, 'public'),
    )
    .orderBy(desc(repost.createdAt))
    .limit(LIMIT);

  // Combine and sort all feed items
  const allFeedItems = [
    ...publicChats.map((chat) => ({
      ...chat,
      isRepost: false as const,
      repostedBy: null as string | null,
    })),
    ...repostItems.map((item) => ({ ...item, isRepost: true as const })),
  ];
  allFeedItems.sort(
    (a, b) =>
      new Date(b.createdAt as any).getTime() -
      new Date(a.createdAt as any).getTime(),
  );
  const feedItems = allFeedItems.slice(0, LIMIT);

  if (!feedItems || feedItems.length === 0) {
    return NextResponse.json({ items: [], nextBefore: null });
  }

  // Get all chat IDs for messages (use original chat ID for reposts)
  const chatIds = feedItems.map((c) =>
    c.isRepost ? (c.originalChatId as string) || c.id : c.id,
  );

  // Load the first user message per chat
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

  // Apply tag and q filtering using first message text, title, and hashtags
  let filtered = feedItems;
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

  // Upvotes per chat for filtered set
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

  // Reposts per chat
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

  // Load authors for attribution (both original authors and reposters)
  const originalUserIds = Array.from(
    new Set(chatsForRender.map((c: any) => c.userId)),
  ) as string[];
  const repostUserIds = Array.from(
    new Set(
      chatsForRender.filter((c) => c.repostedBy).map((c: any) => c.repostedBy),
    ),
  ) as string[];
  const allUserIds = Array.from(
    new Set([...originalUserIds, ...repostUserIds]),
  );

  const authors = allUserIds.length
    ? await db
        .select({
          id: user.id,
          email: user.email,
          nickname: user.nickname as any,
        })
        .from(user)
        .where(inArray(user.id, allUserIds))
    : [];
  const authorById = new Map(authors.map((u: any) => [u.id, u]));

  const items = chatsForRender.map((c: any) => {
    const chatId = c.isRepost ? (c.originalChatId as string) || c.id : c.id;
    const first = firstMsgByChat.get(chatId);
    const text = first ? extractTextFromParts(first.parts as any) : '';
    const imageUrl = first ? extractFirstImageUrl(first) : null;
    const upvotes = upvotesByChat.get(chatId) ?? 0;
    const reposts = repostsByChat.get(chatId) ?? 0;

    let author: string;
    let authorHref: string | null;
    let isRepost = false;
    let repostedBy: string | null = null;
    let repostedByHref: string | null = null;

    if (c.isRepost && c.repostedBy) {
      // For reposts, show original author as main author
      const originalAuthor = authorById.get(c.userId as any) as any;
      const reposter = authorById.get(c.repostedBy as any) as any;

      author = originalAuthor
        ? String(originalAuthor.nickname || '').trim() ||
          `User-${String(originalAuthor.id || '').slice(0, 6)}`
        : 'Пользователь';
      authorHref = originalAuthor
        ? getUserChannelPath(originalAuthor.nickname as any, originalAuthor.id)
        : null;

      repostedBy = reposter
        ? String(reposter.nickname || '').trim() ||
          `User-${String(reposter.id || '').slice(0, 6)}`
        : 'Unknown';
      repostedByHref = reposter
        ? getUserChannelPath(reposter.nickname as any, reposter.id)
        : null;
      isRepost = true;
    } else {
      // Regular post
      const au = authorById.get(c.userId as any) as any;
      author = au
        ? String(au.nickname || '').trim() ||
          `User-${String(au.id || '').slice(0, 6)}`
        : 'Пользователь';
      authorHref = au ? getUserChannelPath(au.nickname as any, au.id) : null;
    }

    return {
      chatId,
      firstMessageId: first?.id ?? null,
      createdAt:
        (c.createdAt as any)?.toISOString?.() ??
        new Date(c.createdAt as any).toISOString(),
      text,
      imageUrl,
      upvotes,
      reposts,
      commentsCount: Math.max(
        0,
        (userMsgCountByChat.get(chatId) ?? 0) - (first ? 1 : 0),
      ),
      hashtags: Array.isArray((c as any).hashtags) ? (c as any).hashtags : [],
      author,
      authorHref,
      isRepost,
      repostedBy,
      repostedByHref,
    };
  });

  const hasMore = feedItems.length === LIMIT;
  const lastCreatedAt = feedItems[feedItems.length - 1]?.createdAt as any;
  const nextBefore =
    hasMore && lastCreatedAt ? new Date(lastCreatedAt).toISOString() : null;

  return NextResponse.json({ items, nextBefore });
}
