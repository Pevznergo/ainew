import { and, asc, desc, eq, inArray, lt, count } from 'drizzle-orm';
import Link from 'next/link';

import { db } from '@/lib/db/queries';
import { chat, message, user, vote } from '@/lib/db/schema';
import { FeedItem } from '@/components/feed/FeedItem';

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
  // from parts
  const parts = Array.isArray(msg?.parts) ? msg.parts : [];
  for (const p of parts) {
    if (p?.type === 'image' && typeof p.imageUrl === 'string' && p.imageUrl) {
      return p.imageUrl;
    }
  }
  // from attachments
  const atts = Array.isArray(msg?.attachments) ? msg.attachments : [];
  for (const a of atts) {
    if (a?.type === 'image' && typeof a.url === 'string' && a.url) {
      return a.url;
    }
  }
  return null;
}

export const dynamic = 'force-dynamic';

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { before?: string; sort?: 'rating' | 'date' };
}) {
  const LIMIT = 50;
  const sort = (searchParams?.sort === 'date' ? 'date' : 'rating') as
    | 'rating'
    | 'date';

  // 1) Get latest public chats
  const beforeDate = searchParams?.before ? new Date(searchParams.before) : null;
  const publicChats = await db
    .select()
    .from(chat)
    .where(
      beforeDate
        ? and(eq(chat.visibility, 'public'), lt(chat.createdAt, beforeDate))
        : eq(chat.visibility, 'public'),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  if (!publicChats || publicChats.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-white/70">
        Публичных чатов пока нет.
      </div>
    );
  }

  const chatIds = publicChats.map((c) => c.id);

  // 2) Get all user messages for these chats, ordered by createdAt asc (first is the initial question)
  const msgs = await db
    .select()
    .from(message)
    .where(and(inArray(message.chatId, chatIds), eq(message.role, 'user')))
    .orderBy(asc(message.createdAt));

  // 3) Take the first user message per chat
  const firstMsgByChat = new Map<string, typeof msgs[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(m.chatId, (userMsgCountByChat.get(m.chatId) ?? 0) + 1);
  }

  // 4) Load users for attribution (optional)
  const userIds = Array.from(new Set(publicChats.map((c) => c.userId)));
  const users = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));
  const userById = new Map(users.map((u) => [u.id, u]));

  // 5) Aggregate upvotes per chat
  const voteRows = await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(and(inArray(vote.chatId, chatIds), eq(vote.isUpvoted, true)))
    .groupBy(vote.chatId);
  const upvotesByChat = new Map<string, number>(voteRows.map((v) => [v.chatId, Number(v.upvotes)]));

  // sort by rating (default) or date
  const chatsForRender = (() => {
    if (sort === 'rating') {
      return [...publicChats].sort((a, b) => {
        const ua = upvotesByChat.get(a.id) ?? 0;
        const ub = upvotesByChat.get(b.id) ?? 0;
        if (ub !== ua) return ub - ua;
        return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
      });
    }
    return publicChats;
  })();

  const hasMore = publicChats.length === LIMIT; // pagination by date only
  const lastCreatedAt = publicChats[publicChats.length - 1]?.createdAt as any;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
        <Link
          href={`/feed?sort=rating`}
          className={`rounded-full px-3 py-1 border ${sort === 'rating' ? 'bg-white/[0.10] border-white/20' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'}`}
        >
          По рейтингу
        </Link>
        <Link
          href={`/feed?sort=date`}
          className={`rounded-full px-3 py-1 border ${sort === 'date' ? 'bg-white/[0.10] border-white/20' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'}`}
        >
          По дате
        </Link>
      </div>

      {chatsForRender.map((c) => {
        const first = firstMsgByChat.get(c.id);
        const text = first ? extractTextFromParts(first.parts as any) : '';
        const imageUrl = first ? extractFirstImageUrl(first) : null;
        const upvotes = upvotesByChat.get(c.id) ?? 0;
        return (
          <FeedItem
            key={c.id}
            chatId={c.id}
            firstMessageId={first?.id ?? null}
            createdAt={(c.createdAt as any)?.toISOString?.() ?? new Date(c.createdAt as any).toISOString()}
            text={text}
            imageUrl={imageUrl}
            initialUpvotes={upvotes}
            commentsCount={Math.max(0, (userMsgCountByChat.get(c.id) ?? 0) - (first ? 1 : 0))}
          />
        );
      })}

      {hasMore && lastCreatedAt && sort === 'date' && (
        <div className="pt-2">
          <Link
            href={`/feed?before=${encodeURIComponent(new Date(lastCreatedAt).toISOString())}&sort=${sort}`}
            className="inline-flex items-center rounded-full bg-white/[0.06] px-4 py-2 text-sm text-white hover:bg-white/[0.08] border border-white/10"
          >
            Загрузить ещё
          </Link>
        </div>
      )}
    </div>
  );
}
