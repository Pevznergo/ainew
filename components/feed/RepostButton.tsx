'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RepostButton({ chatId, isReposted = false }: { chatId: string; isReposted?: boolean }) {
  const [isReposting, setIsReposting] = useState(false);
  const router = useRouter();

  const handleRepost = async () => {
    if (isReposting) return;
    
    try {
      setIsReposting(true);
      const response = await fetch('/api/repost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Repost failed:', error);
        return;
      }

      // Refresh the feed to show the new repost
      router.refresh();
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRepost}
      className={`flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400 transition-colors ${
        isReposted ? 'text-cyan-400' : ''
      }`}
      disabled={isReposting}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
      <span>{isReposting ? '...' : 'Репост'}</span>
    </button>
  );
}
