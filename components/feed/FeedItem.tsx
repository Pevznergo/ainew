"use client";

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { chatModels } from '@/lib/ai/models';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function resolveModelName(): string | null {
  const id = getCookie('chat-model');
  if (!id) return null;
  const normalized = (() => {
    if (/^gpt-4o-mini/.test(id)) return 'gpt-4o-mini-2024-07-18';
    if (/^gpt-4o(?!-mini)/.test(id)) return 'gpt-4o-mini-2024-07-18';
    return id;
  })();
  const model = chatModels.find((m) => m.id === normalized);
  return model?.name || normalized || null;
}

function lsGet<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function lsRemove(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

export function FeedItem({
  chatId,
  firstMessageId,
  createdAt,
  text,
  imageUrl,
  initialUpvotes,
  initialReposts,
  commentsCount,
  hashtags = [],
  author,
  authorHref,
  isRepost = false,
  repostedBy = null,
  repostedByHref = null,
}: {
  chatId: string;
  firstMessageId: string | null;
  createdAt: string;
  text: string;
  imageUrl?: string | null;
  initialUpvotes: number;
  initialReposts: number;
  commentsCount?: number;
  hashtags?: string[];
  author: string;
  authorHref?: string;
  isRepost?: boolean;
  repostedBy?: string | null;
  repostedByHref?: string | null;
}) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [liked, setLiked] = useState(false);
  const [reposts, setReposts] = useState<number>(initialReposts || 0);
  const [reposted, setReposted] = useState<boolean>(false);
  const [isReposting, setIsReposting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);

  const rpKey = `feed_rp:${chatId}`;

  useEffect(() => {
    setModelName(resolveModelName());
  }, []);

  useEffect(() => {
    // 1) Instant local cache hydrate to avoid flicker on reload
    const likeKey = `feed_like:${chatId}`;
    const uvKey = `feed_uv:${chatId}`;
    const rpKey = `feed_rp:${chatId}`;
    const exKey = `feed_expanded:${chatId}`;
    const cachedLike = lsGet<{ liked: boolean }>(likeKey);
    const cachedUv = lsGet<{ upvotes: number }>(uvKey);
    const cachedRp = lsGet<{ reposted: boolean; reposts?: number }>(rpKey);
    const cachedEx = lsGet<{ expanded: boolean }>(exKey);
    if (cachedLike && typeof cachedLike.liked === 'boolean') setLiked(Boolean(cachedLike.liked));
    if (cachedUv && typeof cachedUv.upvotes === 'number') setUpvotes(Number(cachedUv.upvotes));
    if (cachedRp && typeof cachedRp.reposted === 'boolean') setReposted(Boolean(cachedRp.reposted));
    if (cachedRp && typeof cachedRp.reposts === 'number') setReposts(Number(cachedRp.reposts));
    if (cachedEx && typeof cachedEx.expanded === 'boolean') setExpanded(Boolean(cachedEx.expanded));

    // 2) Fetch server truth and reconcile
    const fetchVote = async () => {
      try {
        const res = await fetch(`/api/vote?chatId=${encodeURIComponent(chatId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data?.upvotes === 'number') setUpvotes(Number(data.upvotes));
        if (typeof data?.isUpvotedByMe === 'boolean') setLiked(Boolean(data.isUpvotedByMe));
        // persist fresh snapshot
        if (typeof data?.isUpvotedByMe === 'boolean') lsSet(likeKey, { liked: Boolean(data.isUpvotedByMe) });
        if (typeof data?.upvotes === 'number') lsSet(uvKey, { upvotes: Number(data.upvotes) });
      } catch {}
    };
    fetchVote();
  }, [chatId]);

  const dateLabel = useMemo(() => {
    const d = new Date(createdAt);
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const mm = months[d.getMonth()] ?? '';
    const dd = d.getDate();
    return `${mm} ${dd}`;
  }, [createdAt]);

  const { displayText, isTruncated } = useMemo(() => {
    const MAX = 300;
    if (!text) return { displayText: '', isTruncated: false };
    const raw = String(text);
    if (expanded || raw.length <= MAX) return { displayText: raw, isTruncated: false };
    const cut = raw.slice(0, MAX).trimEnd();
    return { displayText: `${cut}…`, isTruncated: true };
  }, [text, expanded]);

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    lsSet(`feed_expanded:${chatId}`, { expanded: next });
  }

  async function toggleLike() {
    setError(null);
    if (!firstMessageId) return;
    const nextLiked = !liked;
    // optimistic update
    setLiked(nextLiked);
    setUpvotes((v) => (nextLiked ? v + 1 : Math.max(0, v - 1)));
    // write cache immediately for instant subsequent loads
    lsSet(`feed_like:${chatId}`, { liked: nextLiked });
    lsSet(`feed_uv:${chatId}`, { upvotes: (nextLiked ? upvotes + 1 : Math.max(0, upvotes - 1)) });
    try {
      const res = await fetch('/api/vote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messageId: firstMessageId,
          type: nextLiked ? 'up' : 'down',
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Vote failed');
      }
      // success: server will reconcile on next GET; keep cache as-is
    } catch (e: any) {
      // rollback on error
      setLiked((prev) => !prev);
      setUpvotes((v) => (!nextLiked ? v + 1 : Math.max(0, v - 1)));
      // rollback cache
      lsSet(`feed_like:${chatId}`, { liked: !nextLiked });
      lsSet(`feed_uv:${chatId}`, { upvotes });
      setError(e?.message || 'Ошибка голосования');
    } finally {
      // no-op: we don't block UI on network
    }
  }

  async function doRepost() {
    setError(null);
    if (isReposting) return;
    setIsReposting(true);
    
    try {
      const res = await fetch('/api/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const errorMsg = data?.error || 'Ошибка репоста';
        throw new Error(errorMsg);
      }
      
      // Update repost status and count
      setReposted(true);
      setReposts((v) => v + 1);
      lsSet(rpKey, { reposted: true, reposts: reposts + 1 });
      
      // Show success message
      setError('Пост успешно опубликован у вас в профиле');
      
      // Hide the menu after a short delay
      setTimeout(() => {
        setShowRepostMenu(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Repost error:', err);
      setError(err?.message || 'Произошла ошибка');
    } finally {
      setIsReposting(false);
    }
  }

  return (
    <article className="rounded-3xl border border-border bg-card text-card-foreground overflow-hidden">
      {isRepost && repostedBy && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <Repeat2 className="size-3.5" />
          {repostedByHref ? (
            <Link href={repostedByHref} className="hover:underline">
              {repostedBy} репостнул(а)
            </Link>
          ) : (
            <span>{repostedBy} репостнул(а)</span>
          )}
        </div>
      )}
      <div className={isRepost ? 'p-4 pt-2' : 'p-4'}>
        <div className="sm:flex sm:gap-3">
          {/* Avatar with link to user profile */}
          <div className="mb-2 shrink-0 sm:mb-0">
            {authorHref ? (
              <Link href={authorHref}>
                <Avatar name={author} size="md" className="ring-1 ring-border" />
              </Link>
            ) : (
              <Avatar name={author} size="md" className="ring-1 ring-border" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Header (Twitter-like) */}
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              {authorHref ? (
                <Link href={authorHref} className="font-medium text-foreground hover:underline underline-offset-4">
                  {author}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{author}</span>
              )}
              <span className="text-muted-foreground">·</span>
              <time dateTime={createdAt} className="text-muted-foreground">
                {dateLabel}
              </time>
              {modelName && (
                <span className="ml-auto truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {modelName}
                </span>
              )}
            </div>

          {/* Content */}
          <div className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
            {text ? (
              <div className="relative">
                {expanded ? (
                  <>
                    {text}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={toggleExpanded}
                        className="text-xs text-muted-foreground underline decoration-border hover:text-foreground"
                        aria-expanded={expanded}
                      >
                        Свернуть
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {displayText}
                    {isTruncated && (
                      <button
                        type="button"
                        onClick={toggleExpanded}
                        className="ml-1 align-baseline text-xs text-muted-foreground underline decoration-border hover:text-foreground"
                        aria-expanded={expanded}
                      >
                        Показать полностью
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="italic text-muted-foreground">(без текста)</span>
            )}
          </div>

          {/* Hashtags */}
          {Array.isArray(hashtags) && hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {hashtags.map((t) => {
                const tag = String(t || '').toLowerCase();
                if (!tag) return null;
                return (
                  <Link
                    key={tag}
                    href={`/feed?tag=${encodeURIComponent(tag)}`}
                    className="text-xs rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Image */}
          {imageUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="attachment"
                className="h-auto w-full max-h-[480px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between text-muted-foreground">
            <button
              type="button"
              onClick={toggleLike}
              className={`group inline-flex items-center gap-2 rounded-full px-3 py-1 transition-colors ${
                liked ? 'text-rose-500' : 'hover:bg-muted'
              }`}
              aria-pressed={liked}
            >
              <Heart className={`size-5 ${liked ? 'fill-rose-500/20 text-rose-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className={`${liked ? 'text-rose-500' : ''}`}>{upvotes}</span>
            </button>

            <button
              type="button"
              onClick={doRepost}
              className={`group inline-flex items-center gap-2 rounded-full px-3 py-1 transition-colors ${
                reposted ? 'text-emerald-500' : 'hover:bg-muted'
              }`}
              aria-pressed={reposted}
            >
              <Repeat2 className={`size-5 ${reposted ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className={`${reposted ? 'text-emerald-500' : ''}`}>{reposts}</span>
            </button>

            <Link
              href={`/chat/${chatId}#comments`}
              aria-label="Комментарии"
              title="Комментарии"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            >
              <MessageCircle className="size-5" />
            </Link>

            <Link
              href={`/chat/${chatId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            >
              <span>Ответ ИИ</span>
            </Link>

            <button
              type="button"
              aria-label="Поделиться"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => navigator?.share?.({ url: location.href }).catch(() => {})}
            >
              <Share2 className="size-5" />
            </button>

            {/* duplicate repost button removed */}
          </div>

          {error && <div className="mt-2 text-[11px] text-destructive">{error}</div>}
        </div>
      </div>
    </div>
    </article>
  );
}
