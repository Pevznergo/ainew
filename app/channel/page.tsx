import { and, asc, desc, eq, inArray, lt, count } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';

import { db } from '@/lib/db/queries';
import { chat, message, user, vote } from '@/lib/db/schema';
import { FeedItem } from '@/components/feed/FeedItem';
import { ChannelListClient } from '@/components/feed/ChannelListClient';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import SidebarProviderClient from '@/components/feed/SidebarProviderClient';
import { auth } from '@/app/(auth)/auth';
import { PlusIcon, HomeIcon, MessageIcon, UserIcon } from '@/components/icons';

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

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Мой канал — Aporto AI',
  description: 'Посты, созданные мной. Лента обновляется по мере прокрутки.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/channel',
  },
};

export default async function ChannelPage({
  searchParams,
}: {
  searchParams?: Promise<{ before?: string; sort?: 'rating' | 'date'; tag?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    // Redirect unauthenticated users to login
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">
        Для просмотра вашего канала необходимо <Link href="/login" className="underline">войти</Link>.
      </div>
    );
  }

  const LIMIT = 50;
  const params = (await searchParams) || {};
  const sort = (params?.sort === 'date' ? 'date' : 'rating') as 'rating' | 'date';
  const tag = (params?.tag || '').toLowerCase().trim();
  const q = (params?.q || '').toLowerCase().trim();

  const beforeDate = params?.before ? new Date(params.before) : null;
  const myChats = await db
    .select({ id: chat.id, createdAt: chat.createdAt, title: chat.title, userId: chat.userId, visibility: chat.visibility, hashtags: chat.hashtags as any })
    .from(chat)
    .where(beforeDate ? and(eq(chat.userId, session.user.id), lt(chat.createdAt, beforeDate)) : eq(chat.userId, session.user.id))
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  if (!myChats || myChats.length === 0) {
    return (
      <SidebarProviderClient>
        <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">
          У вас пока нет постов.
        </div>
      </SidebarProviderClient>
    );
  }

  const allChatIds = myChats.map((c) => c.id);
  const msgs = await db
    .select()
    .from(message)
    .where(and(inArray(message.chatId, allChatIds), eq(message.role, 'user')))
    .orderBy(asc(message.createdAt));

  const firstMsgByChat = new Map<string, typeof msgs[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(m.chatId, (userMsgCountByChat.get(m.chatId) ?? 0) + 1);
  }

  let filteredChats = tag
    ? (myChats as any).filter((c: any) => Array.isArray(c?.hashtags) && c.hashtags.some((t: string) => String(t).toLowerCase() === tag))
    : myChats;

  if (q) {
    const qlc = q;
    filteredChats = (filteredChats as any).filter((c: any) => {
      const first = firstMsgByChat.get(c.id);
      const body = first ? extractTextFromParts((first as any).parts).toLowerCase() : '';
      const title = String((c as any).title || '').toLowerCase();
      const tags = Array.isArray((c as any).hashtags) ? ((c as any).hashtags as string[]) : [];
      return body.includes(qlc) || title.includes(qlc) || tags.some((t) => String(t || '').toLowerCase().includes(qlc));
    });
  }

  // Aggregate upvotes
  const voteRows = await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(and(inArray(vote.chatId, filteredChats.map((c) => c.id)), eq(vote.isUpvoted, true)))
    .groupBy(vote.chatId);
  const upvotesByChat = new Map<string, number>(voteRows.map((v) => [v.chatId, Number(v.upvotes)]));

  const chatsForRender = (() => {
    if (sort === 'rating') {
      return [...filteredChats].sort((a, b) => {
        const ua = upvotesByChat.get(a.id) ?? 0;
        const ub = upvotesByChat.get(b.id) ?? 0;
        if (ub !== ua) return ub - ua;
        return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
      });
    }
    return filteredChats;
  })();

  const me = await db
    .select({ id: user.id, email: user.email, nickname: user.nickname as any })
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((rows) => rows[0]);

  const author = me ? (String(me.nickname || '').trim() || String(me.email || '').trim() || 'Пользователь') : 'Пользователь';

  const hasMore = myChats.length === LIMIT;
  const lastCreatedAt = myChats[myChats.length - 1]?.createdAt as any;
  const initialNextBefore = hasMore && lastCreatedAt && sort === 'date' ? new Date(lastCreatedAt).toISOString() : null;

  // Compute popular tags within my chats
  const tagCounts = new Map<string, number>();
  for (const c of filteredChats) {
    const tags = Array.isArray((c as any).hashtags) ? ((c as any).hashtags as string[]) : [];
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

  return (
    <SidebarProviderClient>
      <div className="w-full flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[280px,1fr,320px] gap-6">
            <aside className="hidden md:block sticky top-4 self-start">
              <div className="flex h-[calc(100vh-2rem)] flex-col justify-between">
                <nav className="flex flex-col gap-2 text-sm">
                  <Link href="/feed" className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <img src="/images/logo.png" alt="Главная" className="h-4 w-4 rounded-full object-cover" />
                      <span>Главная</span>
                    </span>
                  </Link>
                  <Link href="/channel" className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <HomeIcon size={16} />
                      <span>Мой канал</span>
                    </span>
                  </Link>
                  <Link href="/feed" className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <MessageIcon size={16} />
                      <span>Лента</span>
                    </span>
                  </Link>
                  <Link href="/profile" className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <UserIcon />
                      <span>Профиль</span>
                    </span>
                  </Link>
                  <Link href="/" className="mt-2 block rounded-xl px-3 py-2 border border-green-600/40 bg-green-500/10 text-green-600 dark:text-green-300 hover:bg-green-500/20">
                    <span className="inline-flex items-center gap-2">
                      <PlusIcon />
                      <span>Новый чат</span>
                    </span>
                  </Link>
                </nav>
                <div className="pt-4">
                  {session && <SidebarUserNav session={session} />}
                </div>
              </div>
            </aside>

            <main className="space-y-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Link
                  href={`/channel?sort=rating${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={`rounded-full px-3 py-1 border ${sort === 'rating' ? 'bg-accent border-border' : 'bg-muted/50 border-border hover:bg-muted'}`}
                >
                  По рейтингу
                </Link>
                <Link
                  href={`/channel?sort=date${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={`rounded-full px-3 py-1 border ${sort === 'date' ? 'bg-accent border-border' : 'bg-muted/50 border-border hover:bg-muted'}`}
                >
                  По дате
                </Link>
                {tag && (
                  <div className="ml-2 flex items-center gap-2">
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Тег: #{tag}</span>
                    <Link
                      href={`/channel?sort=${sort}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                      className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      Сбросить тег
                    </Link>
                  </div>
                )}
                {q && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Поиск: “{q}”</span>
                    <Link
                      href={`/channel?sort=${sort}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
                      className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      Сбросить поиск
                    </Link>
                  </div>
                )}
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
                    initialReposts={0}
                    commentsCount={Math.max(0, (userMsgCountByChat.get(c.id) ?? 0) - (first ? 1 : 0))}
                    hashtags={Array.isArray((c as any).hashtags) ? ((c as any).hashtags as string[]) : []}
                    author={author}
                  />
                );
              })}

              {sort === 'date' && (
                <ChannelListClient
                  initialItems={[]}
                  initialNextBefore={initialNextBefore}
                  sort={sort}
                  tag={tag || undefined}
                  q={q || undefined}
                />
              )}
            </main>

            <aside className="hidden md:block sticky top-4 self-start space-y-4">
              <div className="rounded-2xl border border-border bg-muted/40 p-3">
                <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">Популярные теги</div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.length === 0 && (
                    <div className="px-1 text-xs text-muted-foreground">Пока нет тегов</div>
                  )}
                  {popularTags.map((t) => (
                    <Link
                      key={t}
                      href={`/channel?sort=${sort}&tag=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                      className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-green-600/30 bg-green-500/5 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">Активируй ПРО подписку</div>
                <p className="mb-3 text-xs text-muted-foreground">Открой доступ к расширенным возможностям и большему лимиту токенов.</p>
                <Link href="/profile" className="inline-block rounded-xl border border-green-600/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20">Перейти в профиль</Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SidebarProviderClient>
  );
}
