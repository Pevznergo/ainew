'use client';

import dynamic from 'next/dynamic';
import Head from 'next/head';
import { usePathname } from 'next/navigation';

const MainPageClient = dynamic(() => import('./main-client'), {
  ssr: false,
});

export default function MainPage() {
  const pathname = usePathname();
  const demoName = pathname.split('/').pop(); // Получаем название страницы

  return (
    <>
      <Head>
        {/* Preload критических ресурсов для конкретной страницы */}
        <link rel="preload" href={`/demo/${demoName}.jpg`} as="image" />
        <link rel="preload" href={`/demo/${demoName}.png`} as="image" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </Head>
      <MainPageClient />
    </>
  );
}
