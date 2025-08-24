import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { SetRefCookie } from '@/components/set-ref-cookie';

type VisibilityType = 'public' | 'private';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;

  try {
    const chat = await getChatById({ id });
    if (!chat) return { title: 'Чат не найден' };

    // For private chats, only index if the requester is the owner; otherwise, noindex
    if (chat.visibility === 'private') {
      const session = await auth();
      const isOwner = !!session?.user && session.user.id === chat.userId;
      if (!isOwner) {
        return {
          title: 'Приватный чат',
          robots: { index: false, follow: false },
        };
      }
    }

    const messages = await getMessagesByChatId({ id });
    // Find first user message text
    const firstUserText = messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => m.parts || [])
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('\n')
      .slice(0, 300);

    const title = chat.title || 'Чат';
    const description = firstUserText || 'Диалог в Aporto AI';
    const origin = process.env.APP_ORIGIN || 'https://aporto.tech';
    const url = `${origin}/chat/${id}`;

    const robots =
      chat.visibility === 'public'
        ? {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              'max-snippet': -1,
              'max-image-preview': 'large' as const,
            },
          }
        : { index: false, follow: false };

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        siteName: 'Aporto',
        locale: 'ru_RU',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      robots,
    };
  } catch {
    return { title: 'Чат' };
  }
}

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const { id } = params;
  // Referral cookie is set client-side by SetRefCookie component

  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <SetRefCookie />
        <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={
            chat.visibility === 'public' || chat.visibility === 'private'
              ? (chat.visibility as VisibilityType)
              : 'private'
          }
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <SetRefCookie />
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={
          chat.visibility === 'public' || chat.visibility === 'private'
            ? (chat.visibility as VisibilityType)
            : 'private'
        }
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
