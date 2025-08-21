import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Профиль — Aporto',
  description:
    'Управляйте подпиской, балансом токенов и платежами в своём профиле Aporto.',
  applicationName: 'Aporto',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Профиль — Aporto',
    description:
      'Страница профиля Aporto: подписка, баланс токенов и платежи.',
    url: 'https://aporto.tech/profile',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/profile' },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
