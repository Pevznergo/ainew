'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function BioEditModal({ initialBio }: { initialBio: string }) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio || '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:bg-accent transition-colors"
        >
          Редактировать
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1a1a1f] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">
              Редактировать описание профиля
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1 hover:bg-white/10 text-gray-400 hover:text-white">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          
          <Dialog.Description className="mb-4 text-sm text-gray-400">
            Добавьте краткое описание. Оно будет отображаться в шапке вашего канала.
          </Dialog.Description>
          
          <div className="mb-4">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Добавьте описание (до 200 символов)"
              maxLength={200}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>{bio.length}/200</span>
              {error && <span className="text-red-400">{error}</span>}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Dialog.Close className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Отменить
            </Dialog.Close>
            <button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className={`inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                isPending
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90'
              }`}
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
              <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
