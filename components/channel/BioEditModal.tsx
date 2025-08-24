'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function BioEditModal({ initialBio }: { initialBio: string }) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio || '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Keep local state in sync when server-provided bio changes after refresh
  useEffect(() => {
    setBio(initialBio || '');
  }, [initialBio]);

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/bio', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 400 && data?.error === 'bio_too_long') {
            setError('Слишком длинное описание (макс. 200 символов)');
          } else {
            setError('Ошибка сохранения, попробуйте позже');
          }
          return;
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError('Ошибка сети, попробуйте позже');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:bg-accent"
          onClick={() => setOpen(true)}
        >
          Редактировать
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="relative max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Редактировать описание профиля</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Добавьте краткое описание. Оно будет отображаться в шапке вашего канала.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-2">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full min-h-[140px] rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="Добавьте описание (до 200 символов)"
            maxLength={200}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
            <span>{bio.length}/200</span>
            {error && <span className="text-red-400">{error}</span>}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200">Отменить</AlertDialogCancel>
          <AlertDialogAction
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              isPending
                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95'
            }`}
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </AlertDialogAction>
        </AlertDialogFooter>

        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
