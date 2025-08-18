'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RewardsPage() {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Не удалось отправить заявку');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b0b0f]">
      {/* Header (как на странице main) */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="#" className="text-white font-semibold">
            Aporto
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/login"
              className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10"
            >
              Вход
            </Link>
            <Link
              href="/register"
              className="ml-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              Попробовать бесплатно
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 py-24 sm:py-28 md:py-32">
        {/* Top headline */}
        <h1 className="text-balance bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-transparent mb-10 max-w-6xl mx-auto text-center">
          ChatGPT бесплатно на русском языке без VPN и иностранного номера телефона
        </h1>
        {/* Glass card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
            <div className="size-1.5 rounded-full bg-emerald-400" />
            Новая программа вознаграждений
          </div>

          <h1 className="text-balance bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold leading-tight text-transparent sm:text-4xl md:text-5xl">
            Получай вознаграждения за комментарии
          </h1>

          <p className="mt-4 text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
            Делись ссылкой под любыми постами — за новых пользователей мы
            начисляем бонусы и даём ранний доступ к новым возможностям.
          </p>

          <div className="mt-8">
            <AlertDialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) setSubmitted(false);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-6 text-sm font-medium text-white shadow-[0_8px_24px_rgba(56,189,248,0.35)] transition hover:shadow-[0_12px_28px_rgba(56,189,248,0.45)]">
                  Оставить заявку
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border border-white/10 bg-[#0b0b0f] text-white">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">
                          Стань ранним участником
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          Оставь почту, чтобы мы добавили тебя в waitlist и
                          прислали приглашение.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <form onSubmit={onSubmit} className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/80">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="border-white/15 bg-white/[0.04] text-white placeholder:text-white/40 focus-visible:ring-cyan-500 disabled:opacity-60"
                          />
                        </div>

                        {error && (
                          <p className="text-sm text-red-400/90">{error}</p>
                        )}

                        <AlertDialogFooter className="!mt-6">
                          <AlertDialogCancel
                            disabled={loading}
                            className="rounded-full border-white/15 bg-white/[0.02] text-white/80 hover:bg-white/[0.06] disabled:opacity-60"
                          >
                            Отмена
                          </AlertDialogCancel>
                          <Button
                            type="submit"
                            disabled={loading}
                            className="relative rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white hover:opacity-95 disabled:opacity-60"
                          >
                            {loading ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Отправляем...
                              </span>
                            ) : (
                              'Добавить в waitlist'
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">
                          Спасибо! Ты в списке ожидания
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          Мы свяжемся с тобой по адресу{' '}
                          <span className="text-white">{email}</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="mt-4 flex items-center justify-center">
                        <motion.div
                          className="size-12 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                          initial={{ scale: 0.8, opacity: 0.8 }}
                          animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <AlertDialogFooter className="!mt-6">
                        <AlertDialogAction
                          onClick={() => setOpen(false)}
                          className="rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white hover:opacity-95"
                        >
                          Готово
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
