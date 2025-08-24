"use client";

import { useEffect, useRef, useState } from 'react';
import { FeedItem } from './FeedItem';

export type UserChannelItem = {
  chatId: string;
  firstMessageId: string | null;
  createdAt: string;
  text: string;
  imageUrl?: string | null;
  upvotes: number;
  reposts?: number;
  commentsCount?: number;
  hashtags?: string[];
  author: string;
};

export function UserChannelListClient({
  slug,
  initialItems,
  initialNextBefore,
  sort,
  tag,
  q,
  channelPath,
}: {
  slug: string;
  initialItems: UserChannelItem[];
  initialNextBefore: string | null;
  sort: 'rating' | 'date';
  tag?: string | null;
  q?: string | null;
  channelPath?: string;
}) {
  const [items, setItems] = useState<UserChannelItem[]>(initialItems || []);
  const [nextBefore, setNextBefore] = useState<string | null>(initialNextBefore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!nextBefore) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading) {
          void loadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextBefore, loading]);

  async function loadMore() {
    if (!nextBefore) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/u/${encodeURIComponent(slug)}`, location.origin);
      url.searchParams.set('before', nextBefore);
      url.searchParams.set('sort', sort);
      url.searchParams.set('limit', '50');
      if (tag) url.searchParams.set('tag', tag);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        items: UserChannelItem[];
        nextBefore: string | null;
      };
      setItems((prev) => [...prev, ...data.items]);
      setNextBefore(data.nextBefore);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить канал');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.map((it) => (
        <FeedItem
          key={it.chatId}
          chatId={it.chatId}
          firstMessageId={it.firstMessageId}
          createdAt={it.createdAt}
          text={it.text}
          imageUrl={it.imageUrl}
          initialUpvotes={it.upvotes}
          initialReposts={typeof it.reposts === 'number' ? it.reposts : 0}
          commentsCount={it.commentsCount}
          hashtags={it.hashtags || []}
          author={it.author}
          authorHref={channelPath}
        />
      ))}

      {error && <div className="text-center text-sm text-destructive">{error}</div>}
      {loading && <div className="text-center text-sm text-muted-foreground">Загрузка…</div>}

      <div ref={sentinelRef} className="h-8" />
      {!nextBefore && (
        <div className="py-4 text-center text-xs text-muted-foreground">Больше постов нет</div>
      )}
    </>
  );
}
