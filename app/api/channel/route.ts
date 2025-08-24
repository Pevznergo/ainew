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
  const myChats = await db
    .select({ id: chat.id, createdAt: chat.createdAt, title: chat.title, userId: chat.userId, visibility: chat.visibility, hashtags: chat.hashtags as any })
    .from(chat)
    .where(beforeDate ? and(eq(chat.userId, session.user.id), lt(chat.createdAt, beforeDate)) : eq(chat.userId, session.user.id))
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  if (!myChats || myChats.length === 0) {
    return NextResponse.json({ items: [], nextBefore: null });
  }

  const chatIds = myChats.map((c) => c.id);

  const msgs = await db
    .select()
    .from(message)
    .where(and(inArray(message.chatId, chatIds), eq(message.role, 'user')))
    .orderBy(asc(message.createdAt));

  const firstMsgByChat = new Map<string, typeof msgs[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(m.chatId, (userMsgCountByChat.get(m.chatId) ?? 0) + 1);
  }

  let filtered = myChats;
  if (tag) {
    filtered = (filtered as any).filter(
      (c: any) => Array.isArray(c?.hashtags) && c.hashtags.some((t: string) => String(t).toLowerCase() === tag),
    );
  }
  if (q) {
    const qlc = q;
    filtered = (filtered as any).filter((c: any) => {
      const first = firstMsgByChat.get(c.id);
      const body = first ? extractTextFromParts((first as any).parts).toLowerCase() : '';
      const title = String((c as any).title || '').toLowerCase();
      const tags = Array.isArray((c as any).hashtags) ? ((c as any).hashtags as string[]) : [];
      return body.includes(qlc) || title.includes(qlc) || tags.some((t) => String(t || '').toLowerCase().includes(qlc));
    });
  }

  const filteredIds = filtered.map((c) => c.id);
  const voteRows = await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(and(inArray(vote.chatId, filteredIds), eq(vote.isUpvoted, true)))
    .groupBy(vote.chatId);
  const upvotesByChat = new Map<string, number>(voteRows.map((v) => [v.chatId, Number(v.upvotes)]));

  const repostRows = await db
    .select({ chatId: repost.chatId, reposts: count(repost.userId) })
    .from(repost)
    .where(inArray(repost.chatId, filteredIds))
    .groupBy(repost.chatId);
  const repostsByChat = new Map<string, number>(repostRows.map((r) => [r.chatId, Number(r.reposts)]));

  const chatsForRender = (() => {
    if (sort === 'rating') {
      return [...filtered].sort((a, b) => {
        const ua = upvotesByChat.get(a.id) ?? 0;
        const ub = upvotesByChat.get(b.id) ?? 0;
        if (ub !== ua) return ub - ua;
        return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
      });
    }
    return filtered;
  })();

  const authorMap = new Map<string, { id: string; email: string | null; nickname: string | null }>();
  // All items belong to the same author (current user), but we still shape author text similarly
  const me = await db
    .select({ id: user.id, email: user.email, nickname: user.nickname as any })
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((rows) => rows[0]);
  if (me) authorMap.set(me.id as any, me as any);

  const items = chatsForRender.map((c: any) => {
    const first = firstMsgByChat.get(c.id);
    const text = first ? extractTextFromParts(first.parts as any) : '';
    const imageUrl = first ? extractFirstImageUrl(first) : null;
    const upvotes = upvotesByChat.get(c.id) ?? 0;
    const rp = repostsByChat.get(c.id) ?? 0;
    const au = authorMap.get(c.userId as any) as any;
    const author = au ? (String(au.nickname || '').trim() || String(au.email || '').trim() || 'Пользователь') : 'Пользователь';
    return {
      chatId: c.id,
      firstMessageId: first?.id ?? null,
      createdAt: (c.createdAt as any)?.toISOString?.() ?? new Date(c.createdAt as any).toISOString(),
      text,
      imageUrl,
      upvotes,
      reposts: rp,
      commentsCount: Math.max(0, (userMsgCountByChat.get(c.id) ?? 0) - (first ? 1 : 0)),
      hashtags: Array.isArray((c as any).hashtags) ? (c as any).hashtags : [],
      author,
    };
  });

  const hasMore = myChats.length === LIMIT;
  const lastCreatedAt = myChats[myChats.length - 1]?.createdAt as any;
  const nextBefore = hasMore && lastCreatedAt ? new Date(lastCreatedAt).toISOString() : null;

  return NextResponse.json({ items, nextBefore });
}
