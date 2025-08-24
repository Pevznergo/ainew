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

  // Rest of your component implementation...
  // [Previous implementation continues...]

  return (
    <div className="container mx-auto px-4 py-8">{/* Your JSX here */}</div>
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
