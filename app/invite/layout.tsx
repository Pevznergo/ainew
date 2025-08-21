import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Пригласить друзей — Aporto',
  description:
    'Приглашайте друзей в Aporto по реферальной ссылке и получайте бонусы за их регистрацию и оплату подписки.',
  applicationName: 'Aporto',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Пригласить друзей — Aporto',
    description:
      'Делитесь своей реферальной ссылкой Aporto и получайте бонусы за приглашения.',
    url: 'https://aporto.tech/invite',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/invite' },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
