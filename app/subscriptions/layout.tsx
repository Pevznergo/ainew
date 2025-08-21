import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Подписки — Aporto',
  description:
    'Оформление и управление подпиской Aporto. Выберите тариф и получите доступ к дополнительным возможностям.',
  applicationName: 'Aporto',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Подписки — Aporto',
    description:
      'Страница подписок Aporto: оформление и управление подпиской.',
    url: 'https://aporto.tech/subscriptions',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/subscriptions' },
};

export default function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
