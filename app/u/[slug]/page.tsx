import { and, asc, desc, eq, inArray, lt, count, or } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { BioEditModal } from '@/components/channel/BioEditModal';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db/queries';
import { chat, message, user, vote, repost } from '@/lib/db/schema';
import { FeedItem } from '@/components/feed/FeedItem';
import { UserChannelListClient } from '@/components/feed/UserChannelListClient';
import SidebarProviderClient from '@/components/feed/SidebarProviderClient';
import { PlusIcon, HomeIcon, MessageIcon, UserIcon } from '@/components/icons';
import { getUserChannelPath } from '@/lib/paths';
import { auth } from '@/app/(auth)/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

// @ts-ignore - Workaround for Next.js internal type checking
const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await auth();
  const { slug } = await params;
  const searchParamsObj = await searchParams;
  const LIMIT = 50;
  const sort = 'date' as const;
  const tag = ((searchParamsObj.tag as string) || '').toLowerCase().trim();
  const q = ((searchParamsObj.q as string) || '').toLowerCase().trim();
  const before = searchParamsObj.before as string | undefined;

  // Resolve user by slug (nickname or id)
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

  // Get user's public chats with the same logic as the API
  const beforeDate = before ? new Date(before) : null;
  const userChats = await db
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
        ? and(
            eq(chat.userId, u.id),
            eq(chat.visibility, 'public'),
            lt(chat.createdAt, beforeDate),
          )
        : and(eq(chat.userId, u.id), eq(chat.visibility, 'public')),
    )
    .orderBy(desc(chat.createdAt))
    .limit(LIMIT);

  // Get user messages for these chats
  const chatIds = userChats.map((c) => c.id);
  const msgs =
    chatIds.length > 0
      ? await db
          .select()
          .from(message)
          .where(
            and(inArray(message.chatId, chatIds), eq(message.role, 'user')),
          )
          .orderBy(asc(message.createdAt))
      : [];

  // Get votes and reposts
  const [voteRows, repostRows] = await Promise.all([
    chatIds.length > 0
      ? db
          .select({ chatId: vote.chatId, upvotes: count(vote.messageId) })
          .from(vote)
          .where(and(inArray(vote.chatId, chatIds), eq(vote.isUpvoted, true)))
          .groupBy(vote.chatId)
      : [],
    chatIds.length > 0
      ? db
          .select({ chatId: repost.chatId, reposts: count(repost.userId) })
          .from(repost)
          .where(inArray(repost.chatId, chatIds))
          .groupBy(repost.chatId)
      : [],
  ]);

  const upvotesByChat = new Map(
    voteRows.map((v: { chatId: string; upvotes: number }) => [v.chatId, Number(v.upvotes)] as [string, number]),
  );
  const repostsByChat = new Map(
    repostRows.map((r: { chatId: string; reposts: number }) => [r.chatId, Number(r.reposts)] as [string, number]),
  );

  // Process messages
  const firstMsgByChat = new Map<string, (typeof msgs)[number]>();
  const userMsgCountByChat = new Map<string, number>();
  for (const m of msgs) {
    if (!firstMsgByChat.has(m.chatId)) firstMsgByChat.set(m.chatId, m);
    userMsgCountByChat.set(
      m.chatId,
      (userMsgCountByChat.get(m.chatId) ?? 0) + 1,
    );
  }

  // Helper functions
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

  // Create feed items
  const feedItems = userChats.map((c: any) => {
    const first = firstMsgByChat.get(c.id);
    const text = first ? extractTextFromParts(first.parts as any) : '';
    const imageUrl = first ? extractFirstImageUrl(first) : null;
    const upvotes = upvotesByChat.get(c.id) ?? 0;
    const rp = repostsByChat.get(c.id) ?? 0;
    const author =
      String(u.nickname || '').trim() ||
      String(u.email || '').trim() ||
      'Пользователь';
    return {
      chatId: c.id,
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
        (userMsgCountByChat.get(c.id) ?? 0) - (first ? 1 : 0),
      ),
      hashtags: Array.isArray((c as any).hashtags) ? (c as any).hashtags : [],
      author,
      chat: c,
    };
  });

  const displayName =
    String(u.nickname || '').trim() ||
    String(u.email || '').trim() ||
    'Пользователь';
  const userBio = String((u as any).bio || '').trim();
  const isOwner = session?.user?.id === u.id;

  return (
    <SidebarProvider>
      <AppSidebar user={session?.user} session={session} />
      <SidebarInset className="min-h-screen bg-[#0b0b0f] text-white">
        <div className="container mx-auto px-4 py-8">
          {/* User Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="size-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground">
                    @{String(u.nickname || u.id).slice(0, 20)}
                  </p>
                  {userBio && (
                    <p className="mt-2 text-sm text-muted-foreground max-w-md">
                      {userBio}
                    </p>
                  )}
                </div>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground">
                  @{String(u.nickname || u.id).slice(0, 20)}
                </p>
                {userBio && (
                  <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    {userBio}
                  </p>
                )}
              </div>
            </div>
            {isOwner && <BioEditModal initialBio={userBio} />}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {feedItems.length > 0 ? (
            feedItems.map((item) => (
              <FeedItem
                key={item.chatId}
                chatId={item.chatId}
                firstMessageId={item.firstMessageId}
                createdAt={item.createdAt}
                text={item.text}
                imageUrl={item.imageUrl || ''}
                initialUpvotes={upvotesByChat.get(item.chatId) || 0}
                initialReposts={repostsByChat.get(item.chatId) || 0}
                commentsCount={item.commentsCount}
                hashtags={item.hashtags}
                author={item.author}
                authorHref={`/u/${item.author}`}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwner
                  ? 'У вас пока нет публичных постов'
                  : 'У пользователя пока нет публичных постов'}
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

// @ts-ignore - Workaround for Next.js internal type checking
Page.generateMetadata = async ({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
  const { slug } = await params;
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

  if (!u) {
    return {
      title: 'Пользователь не найден',
      description: 'Пользователь с таким именем не найден',
    };
  }

  const display = u
    ? String(u.nickname || '').trim() ||
      String(u.email || '').trim() ||
      'Пользователь'
    : slug;
  const preferredSlug = u ? String(u.nickname || '').trim() || u.id : slug;
  const userBio = String((u as any).bio || '').trim();

  return {
    title: `${display} — канал пользователя`,
    description: `Публичные посты пользователя ${display}.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/u/${preferredSlug}` },
  };
};

export default Page;
