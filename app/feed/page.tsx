import { and, asc, desc, eq, inArray, lt, count } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';

import { db, getUserSubscriptionStatus } from '@/lib/db/queries';
import { chat, message, user, vote, repost } from '@/lib/db/schema';
import { FeedItem } from '@/components/feed/FeedItem';
import { FeedListClient } from '@/components/feed/FeedListClient';
import { auth } from '@/app/(auth)/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ModelProvider } from '@/contexts/model-context';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { FeedHeader } from '@/components/feed-header';
import { cookies } from 'next/headers';
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

export const metadata: Metadata = {
  title: 'Лента — Aporto AI',
  description:
    'Публичные посты пользователей и ответы ИИ. Лента обновляется по мере прокрутки.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/feed',
  },
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{
    before?: string;
    sort?: 'rating' | 'date';
    tag?: string;
    q?: string;
  }>;
}) {
  const session = await auth();
  const LIMIT = 50;
  const params = (await searchParams) || {};
  const sort = (params?.sort === 'date' ? 'date' : 'rating') as
    | 'rating'
    | 'date';
  const tag = (params?.tag || '').toLowerCase().trim();
  const q = (params?.q || '').toLowerCase().trim();

  // 1) Get both original posts and reposts in chronological order
  const beforeDate = params?.before ? new Date(params.before) : null;

  // Get original public chats
  const publicChats = await db
    .select({
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title,
      userId: chat.userId,
      visibility: chat.visibility,
      hashtags: chat.hashtags as any,
      isRepost: chat.isRepost,
      originalChatId: chat.originalChatId,
      originalAuthorId: chat.originalAuthorId,
    })
    .from(chat)
    .where(
      beforeDate
        ? and(eq(chat.visibility, 'public'), lt(chat.createdAt, beforeDate))
        : eq(chat.visibility, 'public'),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  // Get recent reposts as feed items (sorted by repost time)
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

  // Get repost counts for all chats
  const repostCounts = await db
    .select({
      chatId: repost.chatId,
      count: count().as('count'),
    })
    .from(repost)
    .groupBy(repost.chatId);

  // Convert to Map for easy lookup
  const repostsByChat = new Map(
    repostCounts.map((rc) => [rc.chatId, Number(rc.count)]),
  );

  // 2) Get all user messages for current feed items, ordered by createdAt asc (first is the initial question)
  const allChatIds = feedItems.map((c) =>
    c.isRepost ? (c.originalChatId as string) || c.id : c.id,
  );
  const msgs = await db
    .select()
    .from(message)
    .where(
      and(
        inArray(message.chatId, allChatIds as string[]),
        eq(message.role, 'user'),
      ),
    )
    .orderBy(asc(message.createdAt));

  // 3) Take the first user message per chat
  const firstMsgByChat = new Map<string, (typeof msgs)[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(
      m.chatId,
      (userMsgCountByChat.get(m.chatId) ?? 0) + 1,
    );
  }

  // 4) Now apply tag and query filters using chat + first message content
  let filteredChats = tag
    ? feedItems.filter(
        (c: any) =>
          Array.isArray(c?.hashtags) &&
          c.hashtags.some((t: string) => String(t).toLowerCase() === tag),
      )
    : feedItems;

  if (q) {
    const qlc = q;
    filteredChats = filteredChats.filter((c: any) => {
      const chatId = c.isRepost ? c.originalChatId || c.id : c.id;
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

  if (!filteredChats || filteredChats.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">
        Публичных чатов пока нет.
      </div>
    );
  }

  const chatIds = filteredChats.map((c) =>
    c.isRepost ? (c.originalChatId as string) || c.id : c.id,
  );

  // 5) Load users for attribution (both original authors and reposters)
  const originalUserIds = Array.from(
    new Set(filteredChats.map((c) => c.userId)),
  ) as string[];
  const repostUserIds = Array.from(
    new Set(filteredChats.filter((c) => c.repostedBy).map((c) => c.repostedBy)),
  ) as string[];
  const allUserIds = Array.from(
    new Set([...originalUserIds, ...repostUserIds]),
  );

  const users = await db
    .select({ id: user.id, email: user.email, nickname: user.nickname as any })
    .from(user)
    .where(inArray(user.id, allUserIds));
  const userById = new Map(users.map((u) => [u.id, u]));

  // 6) Aggregate upvotes per chat for final filtered set
  const voteRows = await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(
      and(inArray(vote.chatId, chatIds as string[]), eq(vote.isUpvoted, true)),
    )
    .groupBy(vote.chatId);
  const upvotesByChat = new Map<string, number>(
    voteRows.map((v) => [v.chatId, Number(v.upvotes)]),
  );

  // sort by rating (default) or date
  const chatsForRender = (() => {
    if (sort === 'rating') {
      return [...filteredChats].sort((a, b) => {
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
    return filteredChats;
  })();

  const hasMore = feedItems.length === LIMIT; // pagination by date only
  const lastCreatedAt = feedItems[feedItems.length - 1]?.createdAt as any;
  const initialNextBefore =
    hasMore && lastCreatedAt && sort === 'date'
      ? new Date(lastCreatedAt).toISOString()
      : null;

  // Compute simple popular tags list from currently loaded chats
  const tagCounts = new Map<string, number>();
  for (const c of filteredChats) {
    const tags = Array.isArray((c as any).hashtags)
      ? ((c as any).hashtags as string[])
      : [];
    for (const t of tags) {
      const key = String(t || '').toLowerCase();
      if (!key) continue;
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const popularTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  const cookieStore = cookies();
  const isCollapsed =
    (await cookieStore).get('sidebar:state')?.value !== 'true';
  const chatModelFromCookie = (await cookieStore).get('chat-model');
  const userId = session?.user?.id;
  let subscriptionStatus = null;

  if (userId) {
    subscriptionStatus = await getUserSubscriptionStatus(userId);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <DataStreamProvider>
          <ModelProvider initialModel={chatModelFromCookie?.value}>
            {session && <AppSidebar user={session.user} session={session} />}
            <SidebarInset className="flex-1 overflow-auto">
              <FeedHeader session={session} />
              <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
                  {/* Center feed */}
                  <main className="space-y-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Link
                        href={`/feed?sort=rating${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                        className={`rounded-full px-3 py-1 border ${sort === 'rating' ? 'bg-accent border-border' : 'bg-muted/50 border-border hover:bg-muted'}`}
                      >
                        По рейтингу
                      </Link>
                      <Link
                        href={`/feed?sort=date${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                        className={`rounded-full px-3 py-1 border ${sort === 'date' ? 'bg-accent border-border' : 'bg-muted/50 border-border hover:bg-muted'}`}
                      >
                        По дате
                      </Link>
                      {tag && (
                        <div className="ml-2 flex items-center gap-2">
                          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                            Тег: #{tag}
                          </span>
                          <Link
                            href={`/feed?sort=${sort}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                          >
                            Сбросить тег
                          </Link>
                        </div>
                      )}
                      {q && (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                            Поиск: “{q}”
                          </span>
                          <Link
                            href={`/feed?sort=${sort}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
                            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                          >
                            Сбросить поиск
                          </Link>
                        </div>
                      )}
                    </div>

                    {chatsForRender.map((c) => {
                      const chatId = c.isRepost
                        ? (c.originalChatId as string) || c.id
                        : c.id;
                      const first = firstMsgByChat.get(chatId);
                      const text = first
                        ? extractTextFromParts(first.parts as any)
                        : '';
                      const imageUrl = first
                        ? extractFirstImageUrl(first)
                        : null;
                      const upvotes = upvotesByChat.get(chatId) ?? 0;

                      let authorName: string;
                      let authorLink: string;
                      let repostedByName: string | null = null;
                      let repostedByLink: string | null = null;

                      if (c.isRepost && c.repostedBy) {
                        // For reposts, show original author as main author
                        const originalAuthor = userById.get(
                          c.userId as any,
                        ) as any;
                        const reposter = userById.get(
                          c.repostedBy as any,
                        ) as any;

                        authorName = originalAuthor
                          ? String(originalAuthor.nickname || '').trim() ||
                            `User-${String(originalAuthor.id || '').slice(0, 6)}`
                          : 'Unknown';
                        authorLink = originalAuthor
                          ? getUserChannelPath(
                              originalAuthor.nickname,
                              originalAuthor.id,
                            )
                          : '#';

                        // Show who reposted it
                        repostedByName = reposter
                          ? String(reposter.nickname || '').trim() ||
                            `User-${String(reposter.id || '').slice(0, 6)}`
                          : 'Unknown';
                        repostedByLink = reposter
                          ? getUserChannelPath(reposter.nickname, reposter.id)
                          : '#';
                      } else {
                        // Regular post
                        const author = userById.get(c.userId as any) as any;
                        authorName = author
                          ? String(author.nickname || '').trim() ||
                            `User-${String(author.id || '').slice(0, 6)}`
                          : 'Unknown';
                        authorLink = author
                          ? getUserChannelPath(author.nickname, author.id)
                          : '#';
                      }

                      return (
                        <FeedItem
                          key={`${c.id}-${c.isRepost ? c.repostedBy : 'original'}`}
                          chatId={chatId}
                          firstMessageId={first?.id || null}
                          createdAt={c.createdAt as any}
                          text={text}
                          imageUrl={imageUrl}
                          initialUpvotes={upvotes}
                          initialReposts={repostsByChat.get(chatId) ?? 0}
                          commentsCount={
                            userMsgCountByChat.get(chatId) - (first ? 1 : 0)
                          }
                          hashtags={
                            Array.isArray((c as any).hashtags)
                              ? (c as any).hashtags
                              : []
                          }
                          author={authorName}
                          authorHref={authorLink}
                          isRepost={c.isRepost}
                          repostedBy={repostedByName}
                          repostedByHref={repostedByLink}
                        />
                      );
                    })}

                    {/* Infinite scroll after initial SSR items */}
                    {sort === 'date' && (
                      <FeedListClient
                        initialItems={[]}
                        initialNextBefore={initialNextBefore}
                        sort={sort}
                        tag={tag || undefined}
                        q={q || undefined}
                      />
                    )}
                  </main>

                  {/* Right sidebar */}
                  <aside className="hidden lg:block sticky top-4 self-start space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/40 p-3">
                      <form action="/feed" method="GET">
                        <input
                          type="text"
                          name="q"
                          defaultValue={q || ''}
                          placeholder="Поиск в ленте..."
                          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                        <input type="hidden" name="sort" value={sort} />
                        {tag && <input type="hidden" name="tag" value={tag} />}
                      </form>
                    </div>
                    {!subscriptionStatus?.subscription_active && (
                      <div className="rounded-2xl border border-green-600/30 bg-green-500/5 p-4">
                        <div className="mb-2 text-sm font-medium text-foreground">
                          Активируй ПРО подписку
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">
                          Открой доступ к расширенным возможностям и большему
                          лимиту токенов.
                        </p>
                        <Link
                          href="/profile"
                          className="inline-block rounded-xl border border-green-600/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-600 dark:text-green-300 hover:bg-green-500/20"
                        >
                          Перейти в профиль
                        </Link>
                      </div>
                    )}
                    <div className="rounded-2xl border border-border bg-muted/40 p-3">
                      <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                        Популярные теги
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.length === 0 && (
                          <div className="px-1 text-xs text-muted-foreground">
                            Пока нет тегов
                          </div>
                        )}
                        {popularTags.map((t) => (
                          <Link
                            key={t}
                            href={`/feed?sort=${sort}&tag=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* Right sidebar */}
                  <aside className="hidden md:block sticky top-4 self-start space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <form action="/feed" method="GET">
                        <input
                          type="text"
                          name="q"
                          defaultValue={q || ''}
                          placeholder="Поиск в ленте..."
                          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                        <input type="hidden" name="sort" value={sort} />
                        {tag && <input type="hidden" name="tag" value={tag} />}
                      </form>
                    </div>
                    {!subscriptionStatus?.subscription_active && (
                      <div className="rounded-2xl border border-green-600/30 bg-green-500/5 p-4">
                        <div className="mb-2 text-sm font-medium text-foreground">
                          Активируй ПРО подписку
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">
                          Открой доступ к расширенным возможностям и большему
                          лимиту токенов.
                        </p>
                        <Link
                          href="/profile"
                          className="inline-block rounded-xl border border-green-600/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20"
                        >
                          Перейти в профиль
                        </Link>
                      </div>
                    )}
                    <div className="rounded-2xl border border-border bg-muted/40 p-3">
                      <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                        Популярные теги
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.length === 0 && (
                          <div className="px-1 text-xs text-muted-foreground">
                            Пока нет тегов
                          </div>
                        )}
                        {popularTags.map((t) => (
                          <Link
                            key={t}
                            href={`/feed?sort=${sort}&tag=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </SidebarInset>
          </ModelProvider>
        </DataStreamProvider>
      </SidebarProvider>
    </div>
  );
}
