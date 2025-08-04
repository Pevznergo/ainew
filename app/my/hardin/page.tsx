'use client';

import dynamic from 'next/dynamic';

const MainPageClient = dynamic(() => import('./main-client'), {
  ssr: false,
});

export default function MainPage() {
  return <MainPageClient />;
}
