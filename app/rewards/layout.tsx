import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Бонусы за комментарии — программа вознаграждений Aporto | ChatGPT бесплатно на русском',
  },
  description:
    'Получай бонусы за комментарии и приглашения друзей. Aporto — ChatGPT бесплатно на русском без VPN и иностранного номера. Присоединяйся к программе вознаграждений.',
  alternates: {
    canonical: 'https://aporto.tech/rewards',
  },
  openGraph: {
    title: 'Бонусы за комментарии — программа вознаграждений Aporto | ChatGPT бесплатно на русском',
    description:
      'Получай бонусы за комментарии и приглашения друзей. Aporto — ChatGPT бесплатно на русском без VPN и иностранного номера. Присоединяйся к программе вознаграждений.',
    url: 'https://aporto.tech/rewards',
    siteName: 'Aporto',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Бонусы за комментарии — программа вознаграждений Aporto | ChatGPT бесплатно на русском',
    description:
      'Получай бонусы за комментарии и приглашения друзей. Aporto — ChatGPT бесплатно на русском без VPN и иностранного номера. Присоединяйся к программе вознаграждений.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
