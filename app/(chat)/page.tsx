import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title:
    'Aporto — Все лучшие нейросети на одной платформе: GPT‑5, Claude, Gemini, Midjourney',
  description:
    'Доступ к GPT‑5, Claude, Gemini, DALL·E 3 и Midjourney в одном месте. Чаты, изображения, аудио‑в‑текст и reasoning‑модели. Без VPN. Бесплатный старт и ПРО‑тариф.',
  metadataBase: new URL('https://aporto.tech'),
  applicationName: 'Aporto',
  category: 'technology',
  creator: 'Aporto',
  publisher: 'Aporto',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },
  keywords: [
    'Aporto',
    'AI',
    'ИИ платформа',
    'Chat GPT 5',
    'GPT‑5',
    'Claude 4.0 Sonnet',
    'OpenAI o1',
    'OpenAI o3‑mini',
    'OpenAI o4‑mini',
    'DeepSeek R1',
    'Qwen‑32B',
    'Google Gemini 2.5 Pro',
    'Google Gemini 2.5 Flash',
    'Midjourney',
    'DALL·E 3',
    'генерация изображений',
    'аудио в текст',
    'без VPN',
    'корпоративный тариф',
    'API доступ',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Aporto — Все лучшие нейросети: GPT‑5, Claude, Gemini, Midjourney',
    description:
      'Одна платформа — десятки нейросетей: GPT‑5, Claude, Gemini, DALL·E 3, Midjourney и др. Чаты, изображения, аудио‑в‑текст, reasoning‑модели. Без VPN. Бесплатно попробуйте.',
    url: 'https://aporto.tech/',
    type: 'website',
    siteName: 'Aporto',
    locale: 'ru_RU',
    images: [
      {
        url: '/images/demo.png',
        width: 1200,
        height: 630,
        alt: 'Aporto — демо интерфейса',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aporto — Все лучшие нейросети на одной платформе',
    description:
      'GPT‑5, Claude, Gemini, Midjourney, DALL·E 3. Чаты, изображения, аудио‑в‑текст и reasoning‑модели. Без VPN. Бесплатный старт.',
    images: ['/images/demo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Aporto ',
    url: 'https://aporto.tech',
    logo: 'https://aporto.tech/images/logo.png',
    sameAs: ['https://t.me/aportotech'],
  } as const;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aporto ',
    url: 'https://aporto.tech',
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://aporto.tech/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  } as const;

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
