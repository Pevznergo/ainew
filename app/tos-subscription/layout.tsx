import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Соглашение с подпиской — Aporto',
  description:
    'Условия рекуррентных платежей и подписки Aporto. Подробные правила использования и списания.',
  applicationName: 'Aporto',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Соглашение с подпиской — Aporto',
    description:
      'Публичная оферта Aporto для рекуррентных платежей. Ознакомьтесь с условиями подписки.',
    url: 'https://aporto.tech/tos-subscription',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/tos-subscription' },
};

export default function TosSubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
