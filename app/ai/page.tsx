'use client';

import dynamic from 'next/dynamic';

const AIPageClient = dynamic(() => import('./ai-client'), { ssr: false });

export default function AIPage() {
  return <AIPageClient />;
}
