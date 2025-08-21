import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Aporto',
  description:
    'Политика конфиденциальности сервиса Aporto: как мы собираем, используем и защищаем ваши данные.',
  applicationName: 'Aporto',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Политика конфиденциальности — Aporto',
    description:
      'Узнайте, как Aporto обрабатывает и защищает персональные данные пользователей.',
    url: 'https://aporto.tech/privacy',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
