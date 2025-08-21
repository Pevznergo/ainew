import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение — Aporto',
  description:
    'Пользовательское соглашение Aporto: условия использования сервиса, права и обязанности сторон.',
  applicationName: 'Aporto',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Пользовательское соглашение — Aporto',
    description:
      'Правила и условия использования сервиса Aporto. Ознакомьтесь с пользовательским соглашением.',
    url: 'https://aporto.tech/tos',
    siteName: 'Aporto',
    type: 'website',
  },
  alternates: { canonical: '/tos' },
};

export default function TosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
