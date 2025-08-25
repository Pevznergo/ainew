'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { toast } from '@/components/toast';

type Invite = {
  id: string;
  code: string;
  available_count: number;
  used_count: number;
  created_at: string;
};

// Компонент скелетона для загрузки
function LoadingSkeleton() {
  return (
    <div className="font-geist font-sans bg-[#0b0b0f] min-h-screen flex flex-col text-neutral-100">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="w-20 h-6 bg-neutral-700 rounded animate-pulse" />
          <div className="w-24 h-8 bg-neutral-700 rounded animate-pulse" />
          <div className="w-16 h-10 bg-neutral-700 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6 flex-1 w-full">
        {/* Реферальная ссылка skeleton */}
        <section className="mb-12">
          <div className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center w-full">
            <div className="w-64 h-8 bg-neutral-700 rounded animate-pulse mb-4" />
            <div className="flex w-full max-w-2xl mb-3">
              <div className="flex-1 h-12 bg-neutral-700 rounded-l-lg animate-pulse" />
              <div className="w-24 h-12 bg-neutral-700 rounded-r-lg animate-pulse" />
            </div>
            <div className="w-80 h-6 bg-neutral-700 rounded animate-pulse" />
          </div>
        </section>

        {/* Бонусные шаги skeleton */}
        <section className="mb-16">
          <div className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-10">
            <div className="w-96 h-12 bg-neutral-700/50 rounded animate-pulse mx-auto mb-3" />
            <div className="w-80 h-6 bg-neutral-700/50 rounded animate-pulse mx-auto mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map(() => (
              <div
                key={Math.random()}
                className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center"
              >
                <div className="size-16 bg-neutral-700 rounded-xl animate-pulse mb-5" />
                <div className="w-32 h-6 bg-neutral-700 rounded animate-pulse mb-2" />
                <div className="w-48 h-16 bg-neutral-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA skeleton */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-16">
          <div className="w-96 h-10 bg-neutral-700/50 rounded animate-pulse mx-auto mb-8" />
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <div className="w-40 h-12 bg-neutral-700/50 rounded animate-pulse" />
            <div className="w-48 h-12 bg-neutral-700/50 rounded animate-pulse" />
          </div>
        </section>

        {/* Условия skeleton */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] mb-8">
          <div className="w-64 h-10 bg-neutral-700 rounded animate-pulse mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {Array.from({ length: 6 }).map(() => (
              <div
                key={Math.random()}
                className="rounded-xl border border-white/10 p-6 bg-white/[0.02]"
              >
                <div className="w-32 h-6 bg-neutral-700 rounded animate-pulse mb-3" />
                <div className="w-full h-20 bg-neutral-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="w-full h-16 bg-neutral-700 rounded-lg animate-pulse" />
        </section>
      </main>
    </div>
  );
}

export default function InvitePage() {
  const { data: session, status } = useSession();
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  // invite is created automatically (if missing) on load; no manual button

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Получаем реферальный код пользователя
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/referral/link');
        const data = await response.json();
        setReferralLink(data.referralLink);
        try {
          const url = new URL(data.referralLink);
          setReferralCode(url.searchParams.get('ref') || '');
        } catch (_) {}
      } catch (error) {
        console.error('Failed to fetch referral link:', error);
        setReferralLink('https://aporto.tech/api/auth/guest');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
  }, [session, status]);

  // Ensure invite exists and load it for current user (not for guests)
  useEffect(() => {
    const loadInvites = async () => {
      if (!session?.user) return;
      try {
        // ensure there is an invite row bound to user's referral_code
        await fetch('/api/invite/create', { method: 'POST' }).catch(() => {});

        const res = await fetch('/api/invite/list');
        if (!res.ok) throw new Error('Failed to fetch invites');
        const data = await res.json();
        setInvites(data || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (status === 'authenticated') {
      loadInvites();
    }
  }, [session, status]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      // Можно добавить уведомление об успешном копировании
      alert('Ссылка скопирована!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Показываем скелетон пока загружаемся
  if (status === 'loading' || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="font-geist font-sans bg-[#0b0b0f] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              В чат
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center font-bold text-2xl text-white"
            >
              Aporto
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {!session?.user && (
              <>
                <Link
                  href="/register"
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                >
                  Попробовать бесплатно
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10"
                >
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-5xl mx-auto py-12 px-6 flex-1 w-full">
        {/* Hero секция в стиле main */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Приглашайте друзей в Aporto
          </h1>
          <p className="text-neutral-300 text-lg md:text-xl mb-6 max-w-3xl mx-auto">
            Делитесь своей реферальной ссылкой или инвайт-кодом и получайте
            бонусы.
          </p>
          {!session?.user ? (
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 text-base shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                prefetch
              >
                Попробовать бесплатно
              </Link>
            </div>
          ) : null}
        </section>

        {/* Реферальная ссылка (недоступно для guest) */}
        {session?.user ? (
          <section className="mb-12">
            <div className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center w-full">
              <h2 className="text-2xl font-bold mb-4 text-white">
                Ваша реферальная ссылка
              </h2>
              <div className="flex w-full max-w-2xl mb-3">
                <input
                  type="text"
                  value={referralLink || ''}
                  readOnly
                  className="flex-1 bg-neutral-900 text-white font-mono rounded-l-lg px-5 py-3 outline-none text-base border border-neutral-800"
                />
                <button
                  className="rounded-l-none rounded-r-lg border border-white/10 bg-white/5 px-5 py-3 text-base text-neutral-200 hover:bg-white/10 transition-colors"
                  type="button"
                  onClick={copyToClipboard}
                >
                  Копировать
                </button>
              </div>
              <p className="text-neutral-400 text-base">
                Поделитесь этой ссылкой с друзьями и получите бонусы!
              </p>
              {/* Инвайт-код в этой секции скрыт */}
            </div>
          </section>
        ) : null}

        {/* Инвайт-код (недоступно для guest) */}
        {session?.user ? (
          <section className="mb-12">
            <div className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] w-full">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Инвайт-код</h2>
              </div>

              {invites.length === 0 ? (
                <p className="text-neutral-400">У вас пока нет инвайтов.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-white font-mono text-lg">
                          {inv.code}
                        </div>
                        <div className="text-neutral-400 text-sm mt-1">
                          Доступно:{' '}
                          {Math.max(
                            0,
                            (inv.available_count || 0) - (inv.used_count || 0),
                          )}{' '}
                          из {inv.available_count}
                        </div>
                      </div>
                      <button
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10 transition-colors"
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inv.code);
                            toast({
                              type: 'success',
                              description: 'Код скопирован',
                            });
                          } catch (_) {}
                        }}
                      >
                        Копировать код
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Бонусные шаги */}
        <section className="mb-16">
          <div className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Приглашайте друзей и получайте бонусы до 40 000 рублей!
            </h1>
            <p className="text-xl opacity-90 mb-6">
              Ваша реферальная программа — это просто:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step, idx) => (
              <div
                key={step}
                className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-green-400 text-black size-16 flex items-center justify-center rounded-xl text-3xl font-extrabold mb-5 shadow">
                  {step}
                </div>
                <h4 className="font-bold text-xl mb-2 text-white">
                  {idx === 0 && 'Получите ссылку'}
                  {idx === 1 && 'Пригласите друга'}
                  {idx === 2 && 'Получите бонус'}
                </h4>
                <p className="text-neutral-400 text-center text-base">
                  {idx === 0 && 'Получите свою уникальную реферальную ссылку'}
                  {idx === 1 &&
                    'Поделитесь своей реферальной ссылкой с друзьями и знакомыми'}
                  {idx === 2 &&
                    'Когда ваш друг зарегистрируется и начнет использовать сервис, вы получите бонус'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-8">
            Воспользуйтесь реферальной программой уже сегодня. Вы участвуете?
          </h3>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link
              href="/register"
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 text-base shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              Начать приглашать
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base text-neutral-200 hover:bg-white/10 transition-colors"
            >
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </section>

        {/* Условия и положения */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] mb-8">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            Условия и положения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Бонус за привлечение
              </h3>
              <p className="text-neutral-300 text-base">
                Бонус 1000 токенов (равный 200 рублям) начисляется после того,
                как привлечённый пользователь оплатил подписку на любой тариф.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Условия вывода
              </h3>
              <p className="text-neutral-300 text-base">
                Вывод средств доступен при накоплении не менее 10 000 токенов.
                Для вывода необходимо написать на почту{' '}
                <a
                  href="mailto:hey@aporto.tech"
                  className="underline text-neutral-300 hover:text-white"
                >
                  hey@aporto.tech
                </a>{' '}
                с указанием суммы и реквизитов.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Реферальная ссылка
              </h3>
              <p className="text-neutral-300 text-base">
                Каждый зарегистрированный пользователь получает уникальную
                реферальную ссылку, которую можно делиться с друзьями и
                знакомыми.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Правила начисления
              </h3>
              <p className="text-neutral-300 text-base">
                Бонус начисляется только за реальных пользователей, которые
                прошли полную регистрацию и совершили оплату подписки.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Срок действия
              </h3>
              <p className="text-neutral-300 text-base">
                Реферальная программа действует бессрочно. Бонусы не имеют срока
                действия и накапливаются на вашем балансе.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <h3 className="font-semibold text-neutral-200 mb-3">
                Ограничения
              </h3>
              <p className="text-neutral-300 text-base">
                Запрещено создание множественных аккаунтов для получения
                бонусов. Нарушение правил ведёт к блокировке аккаунта.
              </p>
            </div>
          </div>
          <div className="bg-yellow-100/10 border border-yellow-400/30 rounded-lg p-5 text-center text-yellow-300 text-base">
            <strong>Важно:</strong> Все бонусы начисляются в валюте токенов.
            Курс обмена: 1 токен = 0.2 рубля. Компания оставляет за собой право
            изменять условия программы, уведомив пользователей заранее.
          </div>
        </section>
      </main>
      <footer className="mt-8 pb-4">
        <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
          <Link href="/privacy" className="text-neutral-300 hover:text-white">
            Политика конфиденциальности
          </Link>
          <Link href="/tos" className="text-neutral-300 hover:text-white">
            Пользовательское соглашение
          </Link>
          <Link
            href="/tos-subscription"
            className="text-neutral-300 hover:text-white"
          >
            Соглашение с подпиской
          </Link>
          <a
            href="mailto:hey@aporto.tech"
            className="text-neutral-300 hover:text-white"
          >
            Связаться с нами
          </a>
        </nav>
        <div className="text-center text-neutral-500 text-sm">
          {' '}
          2025@ Aporto
        </div>
      </footer>
    </div>
  );
}
