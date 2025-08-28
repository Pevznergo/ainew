'use client';

import { useEffect, useRef, useState } from 'react';
import { FeedItem } from './FeedItem';

export type FeedItemData = {
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
  authorHref?: string | null;
  isRepost?: boolean;
  repostedBy?: string | null;
  repostedByHref?: string | null;
};

export function FeedListClient({
  initialItems,
  initialNextBefore,
  sort,
  tag,
  q,
}: {
  initialItems: FeedItemData[];
  initialNextBefore: string | null;
  sort: 'rating' | 'date';
  tag?: string | null;
  q?: string | null;
}) {
  const [items, setItems] = useState<FeedItemData[]>(initialItems || []);
  const [nextBefore, setNextBefore] = useState<string | null>(
    initialNextBefore,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!nextBefore) return; // no more

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
      const url = new URL('/api/feed', location.origin);
      url.searchParams.set('before', nextBefore);
      url.searchParams.set('sort', sort);
      url.searchParams.set('limit', '50');
      if (tag) url.searchParams.set('tag', tag);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items: FeedItemData[];
        nextBefore: string | null;
      };
      setItems((prev) => [...prev, ...data.items]);
      setNextBefore(data.nextBefore);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить ленту');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.map((it, index) => (
        <FeedItem
          key={`${it.chatId}-${it.isRepost ? 'repost' : 'original'}-${index}`}
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
          authorHref={it.authorHref || undefined}
          isRepost={it.isRepost || false}
          repostedBy={it.repostedBy || null}
          repostedByHref={it.repostedByHref || null}
        />
      ))}

      {/* Status / loader */}
      {error && (
        <div className="text-center text-sm text-destructive">{error}</div>
      )}
      {loading && (
        <div className="text-center text-sm text-muted-foreground">
          Загрузка…
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8" />
      {!nextBefore && (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Больше постов нет
        </div>
      )}
    </>
  );
}
