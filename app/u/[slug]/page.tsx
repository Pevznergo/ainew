import { and, asc, desc, eq, inArray, lt, count, or } from 'drizzle-orm';
import Link from 'next/link';
import { BioEditModal } from '@/components/channel/BioEditModal';
import { Avatar } from '@/components/ui/avatar';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { db, getUserSubscriptionStatus } from '@/lib/db/queries';
import { chat, message, user, vote } from '@/lib/db/schema';
import type { InferModel } from 'drizzle-orm';
import { FeedItem } from '@/components/feed/FeedItem';
import { UserChannelListClient } from '@/components/feed/UserChannelListClient';
import SidebarProviderClient from '@/components/feed/SidebarProviderClient';
import { getUserChannelPath } from '@/lib/paths';
import { auth } from '@/app/(auth)/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ModelProvider } from '@/contexts/model-context';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { cookies } from 'next/headers';

type User = InferModel<typeof user> & {
  bio?: string | null;
  nickname?: string | null;
};

type Chat = InferModel<typeof chat> & {
  hashtags?: string[] | null;
  title?: string | null;
  visibility?: 'public' | 'private';
};

type MessagePart = {
  type: string;
  text?: string;
  imageUrl?: string;
  [key: string]: unknown;
};

type MessageAttachment = {
  type: string;
  url?: string;
  [key: string]: unknown;
};

type Message = InferModel<typeof message> & {
  parts?: MessagePart[];
  attachments?: MessageAttachment[];
};

type SearchParamsType = {
  before?: string;
  sort?: 'rating' | 'date';
  tag?: string;
  q?: string;
  [key: string]: string | string[] | undefined;
};

type BaseProps = {
  params: { slug: string };
  searchParams?: SearchParamsType;
};

type Props = BaseProps;

function extractTextFromParts(parts?: MessagePart[]): string {
  if (!Array.isArray(parts)) return '';
  for (const p of parts) {
    if (p?.type === 'text' && typeof p.text === 'string' && p.text.trim()) {
      return p.text.trim();
    }
  }
  return '';
}

function extractFirstImageUrl(msg: Message): string | null {
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

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const slug = params.slug;
  const u = await db
    .select({
      id: user.id,
      email: user.email,
      nickname: user.nickname as any,
      bio: user.bio as any,
    })
    .from(user)
    .where(or(eq(user.nickname, slug), eq(user.id, slug)))
    .limit(1)
    .then((rows) => rows[0]);

  const display = u
    ? String(u.nickname || '').trim() ||
      String(u.email || '').trim() ||
      'Пользователь'
    : slug;
  const preferredSlug = u ? String(u.nickname || '').trim() || u.id : slug;
  const userBio = String((u as any).bio || '').trim();

  // Always use the preferred slug (nickname if available, otherwise ID) for canonical URL
  const canonicalUrl = `https://aporto.tech/u/${encodeURIComponent(preferredSlug)}`;

  // Enhanced description with user bio if available
  const description = userBio
    ? `${userBio} — Публичные посты пользователя ${display} в Aporto.`
    : `Публичные посты пользователя ${display} в Aporto AI.`;

  // Prevent duplicate content when accessing by ID vs nickname
  const needsRedirect = u && String(u.nickname || '').trim() && slug === u.id;

  // Additional meta tags for better SEO
  const additionalMeta: Record<string, string> = {
    'og:profile:username': preferredSlug,
  };

  if (userBio) {
    additionalMeta['og:description'] = userBio;
  }

  return {
    title: `${display} — канал пользователя | Aporto` as string,
    description: description as string,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large' as const,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${display} — канал пользователя`,
      description: description,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'Aporto',
      locale: 'ru_RU',
      username: preferredSlug,
    },
    twitter: {
      card: 'summary',
      title: `${display} — канал пользователя`,
      description: description,
    },
    other: additionalMeta,
    verification: {
      // Help Google understand this is the authoritative page for this user
      google: needsRedirect ? undefined : 'user-profile-canonical',
    },
  } as Metadata;
}

export default async function UserChannelPage({
  params,
  searchParams = {},
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
} & any) {
  const session = await auth();
  const slug = params.slug;
  const LIMIT = 50;
  // Safely extract and type search params
  const sort =
    searchParams?.sort === 'rating' ? ('rating' as const) : ('date' as const);
  const tag = searchParams?.tag
    ? String(
        Array.isArray(searchParams.tag)
          ? searchParams.tag[0]
          : searchParams.tag,
      )
        .toLowerCase()
        .trim()
    : '';
  const q = searchParams?.q
    ? String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)
        .toLowerCase()
        .trim()
    : '';
  const before = searchParams?.before
    ? String(
        Array.isArray(searchParams.before)
          ? searchParams.before[0]
          : searchParams.before,
      )
    : undefined;

  // Resolve user by slug (nickname or id)
  const u = (
    await db
      .select({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
      })
      .from(user)
      .where(or(eq(user.nickname, slug), eq(user.id, slug)))
      .limit(1)
  )[0] as User | undefined;

  if (!u) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">
        Пользователь не найден.
      </div>
    );
  }

  // If user has a nickname, enforce canonical URL /u/<nickname> instead of /u/<id>
  const nick = String(u.nickname || '').trim();
  if (nick && slug === u.id) {
    redirect(`/u/${encodeURIComponent(nick)}`);
  }

  const beforeDate = before ? new Date(before) : null;
  const channelPath = getUserChannelPath(u.nickname || undefined, u.id);
  const userChats = (await db
    .select({
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title,
      userId: chat.userId,
      visibility: chat.visibility,
      hashtags: chat.hashtags,
    })
    .from(chat)
    .where(
      beforeDate
        ? and(
            eq(chat.userId, u.id),
            eq(chat.visibility, 'public' as const),
            lt(chat.createdAt, beforeDate),
          )
        : and(eq(chat.userId, u.id), eq(chat.visibility, 'public' as const)),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT)) as Chat[];

  if (!userChats || userChats.length === 0) {
    return (
      <SidebarProviderClient>
        <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">
          У пользователя пока нет публичных постов.
        </div>
      </SidebarProviderClient>
    );
  }

  const allChatIds = userChats.map((c) => c.id);
  const msgs = (
    await db
      .select()
      .from(message)
      .where(and(inArray(message.chatId, allChatIds), eq(message.role, 'user')))
      .orderBy(asc(message.createdAt))
  ).map((msg) => ({
    ...msg,
    parts: Array.isArray(msg.parts) ? (msg.parts as MessagePart[]) : undefined,
    attachments: Array.isArray(msg.attachments)
      ? (msg.attachments as MessageAttachment[])
      : undefined,
  }));

  const firstMsgByChat = new Map<string, Message>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    const chatId = String(m.chatId);
    if (!firstMsgByChat.has(chatId)) {
      firstMsgByChat.set(chatId, m);
    }
    userMsgCountByChat.set(chatId, (userMsgCountByChat.get(chatId) ?? 0) + 1);
  }

  let filteredChats = tag
    ? userChats.filter(
        (c) =>
          Array.isArray(c?.hashtags) &&
          c.hashtags.some((t) => String(t).toLowerCase() === tag),
      )
    : userChats;

  if (q) {
    const qlc = q.toLowerCase();
    filteredChats = filteredChats.filter((c) => {
      const first = firstMsgByChat.get(c.id);
      const body = first ? extractTextFromParts(first.parts).toLowerCase() : '';
      const title = String(c.title || '').toLowerCase();
      const tags = Array.isArray(c.hashtags)
        ? c.hashtags.map((t) => String(t || '').toLowerCase())
        : [];
      return (
        body.includes(qlc) ||
        title.includes(qlc) ||
        tags.some((t) => t.includes(qlc))
      );
    }) as Chat[];
  }

  const voteRows = (await db
    .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
    .from(vote)
    .where(
      and(
        inArray(
          vote.chatId,
          filteredChats.map((c) => c.id),
        ),
        eq(vote.isUpvoted, true),
      ),
    )
    .groupBy(vote.chatId)) as Array<{ chatId: string; upvotes: number }>;
  const upvotesByChat = new Map<string, number>(
    voteRows.map((v) => [v.chatId, Number(v.upvotes)]),
  );

  // Always sort by date
  const chatsForRender = [...filteredChats].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const authorText =
    String(u.nickname || '').trim() ||
    String(u.email || '').trim() ||
    'Пользователь';
  const handle = nick ? `@${nick}` : `@user-${String(u.id).slice(0, 6)}`;
  const isOwner = Boolean(session?.user?.id && session.user.id === u.id);
  const userBio = String(u.bio || '').trim();

  console.log('User channel page:', {
    userId: u.id,
    sessionUserId: session?.user?.id,
    isOwner,
    hasSession: !!session,
    userBio,
  });

  const hasMore = userChats.length === LIMIT;
  const lastCreatedAt = userChats[userChats.length - 1]?.createdAt;
  const initialNextBefore =
    hasMore && lastCreatedAt ? new Date(lastCreatedAt).toISOString() : null;

  // Always sort by date
  filteredChats.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Simple stats for header
  const postsCount = filteredChats.length;
  const totalUpvotes = Array.from(upvotesByChat.values()).reduce(
    (a, b) => a + (b || 0),
    0,
  );

  const tagCounts = new Map<string, number>();
  for (const c of filteredChats) {
    const tags = Array.isArray(c.hashtags) ? c.hashtags : [];
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
              <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
                  <main className="space-y-4">
                    {/* Channel header (Twitter-like) */}
                    <section className="overflow-hidden rounded-3xl border border-border bg-card">
                      {/* Cover */}
                      <div className="h-36 w-full bg-gradient-to-r from-indigo-500/40 via-cyan-500/30 to-fuchsia-500/30" />
                      {/* Profile row */}
                      <div className="px-4 pb-4">
                        <div className="-mt-8 flex items-end gap-3">
                          {/* Avatar */}
                          <div className="size-16 rounded-full ring-2 ring-background border border-border overflow-hidden">
                            <Avatar
                              name={authorText}
                              size="lg"
                              className="size-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-foreground truncate">
                              {authorText}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {handle}
                            </div>
                          </div>
                          {isOwner && <BioEditModal initialBio={userBio} />}
                        </div>
                        {/* Description */}
                        <div className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                          {userBio || 'Описание профиля пока не добавлено.'}
                        </div>
                        {/* Stats */}
                        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">
                              {postsCount}
                            </span>{' '}
                            постов
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              {totalUpvotes}
                            </span>{' '}
                            лайков
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {tag && (
                        <div className="ml-2 flex items-center gap-2">
                          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                            Тег: #{tag}
                          </span>
                          <Link
                            href={`${channelPath}${q ? `?q=${encodeURIComponent(q)}` : ''}`}
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
                            href={`${channelPath}${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`}
                            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                          >
                            Сбросить поиск
                          </Link>
                        </div>
                      )}
                    </div>

                    {chatsForRender.map((c) => {
                      const first = firstMsgByChat.get(c.id);
                      const text = first
                        ? extractTextFromParts(first.parts as any)
                        : '';
                      const imageUrl = first
                        ? extractFirstImageUrl(first)
                        : null;
                      const upvotes = upvotesByChat.get(c.id) ?? 0;
                      return (
                        <FeedItem
                          key={c.id}
                          chatId={c.id}
                          firstMessageId={first?.id ?? null}
                          createdAt={
                            (c.createdAt as any)?.toISOString?.() ??
                            new Date(c.createdAt as any).toISOString()
                          }
                          text={text}
                          imageUrl={imageUrl}
                          initialUpvotes={upvotes}
                          initialReposts={0}
                          commentsCount={Math.max(
                            0,
                            (userMsgCountByChat.get(c.id) ?? 0) -
                              (first ? 1 : 0),
                          )}
                          hashtags={
                            Array.isArray((c as any).hashtags)
                              ? ((c as any).hashtags as string[])
                              : []
                          }
                          author={authorText}
                          authorHref={channelPath}
                        />
                      );
                    })}

                    {sort === 'date' && (
                      <UserChannelListClient
                        slug={slug}
                        initialItems={[]}
                        initialNextBefore={initialNextBefore}
                        sort={sort}
                        tag={tag || undefined}
                        q={q || undefined}
                        channelPath={channelPath}
                      />
                    )}
                  </main>

                  {/* Right sidebar */}
                  <aside className="hidden lg:block sticky top-4 self-start space-y-4">
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
                            href={`${channelPath}?sort=${sort}&tag=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
