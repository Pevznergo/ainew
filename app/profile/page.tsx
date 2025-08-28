'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

      <main className="flex-1 w-full flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* Профиль пользователя skeleton */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4 min-w-[220px]">
              <div className="size-28 bg-neutral-700 rounded-full animate-pulse" />
              <div className="text-center md:text-left">
                <div className="w-32 h-8 bg-neutral-700 rounded animate-pulse mb-2" />
                <div className="w-40 h-6 bg-neutral-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-32 h-12 bg-neutral-700 rounded-xl animate-pulse" />
                <div className="w-40 h-12 bg-neutral-700 rounded animate-pulse" />
              </div>
              <div className="w-full h-6 bg-neutral-700 rounded animate-pulse" />
            </div>
          </section>

          {/* Описание профиля */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04]">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="w-32 h-6 bg-neutral-700 rounded animate-pulse mb-2" />
                <div className="w-80 h-4 bg-neutral-700/80 rounded animate-pulse mb-4" />
                <div className="flex flex-col gap-2">
                  <div className="w-full h-28 rounded-xl bg-neutral-700 animate-pulse" />
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-4 bg-neutral-700 rounded animate-pulse" />
                    <div className="w-28 h-10 bg-neutral-700 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Никнейм — скрываем в скелетоне */}

          {/* Баланс skeleton */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="w-48 h-8 bg-neutral-700 rounded animate-pulse mb-2" />
              <div className="flex items-center gap-6 mb-4">
                <div className="w-32 h-16 bg-neutral-700 rounded-xl animate-pulse" />
              </div>
              <div className="w-full h-6 bg-neutral-700 rounded animate-pulse mb-2" />
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-80 h-12 bg-neutral-700 rounded-lg animate-pulse" />
                <div className="w-48 h-12 bg-neutral-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-80 h-8 bg-neutral-700 rounded animate-pulse" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  // Список пакетов определяем до хуков!
  const packages = [
    { label: '250 токенов — 150 ₽', price: 150, coins: 250, pricePer: '0,60' },
    { label: '800 токенов — 300 ₽', price: 300, coins: 800, pricePer: '0,38' },
    {
      label: '1500 токенов — 500 ₽',
      price: 500,
      coins: 1500,
      pricePer: '0,33',
    },
    {
      label: '4000 токенов — 1500 ₽',
      price: 1500,
      coins: 4000,
      pricePer: '0,38',
    },
    {
      label: '15000 токенов — 3000 ₽',
      price: 3000,
      coins: 15000,
      pricePer: '0,20',
    },
  ];

  // Всегда вызываем useState с первым элементом массива (он всегда есть)
  const [selected, setSelected] = useState(packages[0]);
  const [open, setOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);

  // Состояние для модального окна PRO
  const [showProModal, setShowProModal] = useState(false);
  const [consents, setConsents] = useState({
    offer: false,
    personal: false,
    recurring: false,
    privacy: false,
  });
  const [avatarError, setAvatarError] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nickSaving, setNickSaving] = useState(false);
  const [nickMsg, setNickMsg] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioMsg, setBioMsg] = useState<string | null>(null);

  // Debug mount
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ProfilePage] mounted');
  }, []);

  // Debug modal state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ProfilePage] bioModalOpen =', bioModalOpen);
  }, [bioModalOpen]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<string | null>(null);

  const handleConsentChange = (type: keyof typeof consents) => {
    setConsents((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const saveBio = async () => {
    setBioMsg(null);
    // eslint-disable-next-line no-console
    console.log('[ProfilePage] saveBio start', { bioLength: bio.length, bio });
    try {
      setBioSaving(true);
      const res = await fetch('/api/profile/bio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.log('[ProfilePage] saveBio error', {
          status: res.status,
          data,
        });
        if (res.status === 400 && data?.error === 'bio_too_long')
          setBioMsg('Слишком длинное описание (макс. 200 символов)');
        else setBioMsg('Ошибка сохранения, попробуйте позже');
        return;
      }
      setBio(String(data?.bio ?? bio));
      setBioMsg('Сохранено');
      // eslint-disable-next-line no-console
      console.log('[ProfilePage] saveBio success');
      setBioModalOpen(false);

      // Refresh page to update any task completion status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[ProfilePage] saveBio exception', e);
      setBioMsg('Ошибка сети, попробуйте позже');
    } finally {
      setBioSaving(false);
    }
  };

  const savePassword = async () => {
    setPassMsg(null);
    const curr = String(currentPassword || '');
    const next = String(newPassword || '');
    const conf = String(confirmPassword || '');
    if (!next) {
      setPassMsg('Введите новый пароль');
      return;
    }
    if (next.length < 8) {
      setPassMsg('Пароль слишком короткий (мин. 8 символов)');
      return;
    }
    if (next !== conf) {
      setPassMsg('Подтверждение пароля не совпадает');
      return;
    }
    try {
      setPassSaving(true);
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curr, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data?.error === 'wrong_password') {
          setPassMsg('Текущий пароль неверен');
        } else if (res.status === 400 && data?.error === 'password_too_short') {
          setPassMsg('Пароль слишком короткий (мин. 8 символов)');
        } else {
          setPassMsg('Ошибка сохранения, попробуйте позже');
        }
        return;
      }
      setPassMsg('Пароль обновлён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPassMsg('Ошибка сети, попробуйте позже');
    } finally {
      setPassSaving(false);
    }
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingCoinsPayment, setIsProcessingCoinsPayment] =
    useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);

  const handleProUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем, что все чекбоксы отмечены
    const allChecked = Object.values(consents).every(Boolean);
    if (!allChecked) {
      alert('Пожалуйста, отметьте все пункты для продолжения');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Отправляем запрос на создание платежа
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consents }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // Сохраняем ID платежа в localStorage для отслеживания
      localStorage.setItem('pending_payment_id', data.paymentId);

      // Перенаправляем на страницу оплаты YooKassa
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        throw new Error('Не получена ссылка для оплаты');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(
        `Ошибка при создании платежа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCoinsPurchase = async () => {
    setIsProcessingCoinsPayment(true);

    try {
      // Отправляем запрос на создание платежа за токены
      const response = await fetch('/api/payment/coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageData: {
            coins: selected.coins,
            price: selected.price,
            label: selected.label,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // Сохраняем ID платежа в localStorage для отслеживания
      localStorage.setItem('pending_coins_payment_id', data.paymentId);

      // Перенаправляем на страницу оплаты YooKassa
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        throw new Error('Не получена ссылка для оплаты');
      }
    } catch (error) {
      console.error('Coins payment error:', error);
      alert(
        `Ошибка при создании платежа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setIsProcessingCoinsPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Вы уверены, что хотите отменить подписку и отключить автоплатежи?',
      )
    ) {
      return;
    }

    setIsCancelingSubscription(true);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отмены подписки');
      }

      alert('Подписка успешно отменена. Автоплатежи отключены.');

      // Перезагружаем страницу для обновления статуса
      window.location.reload();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert(
        `Ошибка при отмене подписки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setIsCancelingSubscription(false);
    }
  };

  // Для закрытия dropdown при клике вне
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Initialize nickname from session
  useEffect(() => {
    if (
      session?.user?.nickname ||
      session?.user?.name ||
      session?.user?.email
    ) {
      setNickname(
        (session.user.nickname as string) ||
          session.user.name ||
          session.user.email ||
          '',
      );
    }
  }, [session?.user?.nickname, session?.user?.name, session?.user?.email]);

  // Load bio
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile/bio');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (typeof data?.bio === 'string') setBio(data.bio);
      } catch {}
    };
    if (status === 'authenticated') load();
  }, [status]);

  // Показываем скелетон пока загружаемся
  if (status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-neutral-400">
        <div className="mb-4">Вы не авторизованы.</div>
        <Link href="/login" className="modern-btn-cta">
          Войти
        </Link>
      </div>
    );
  }

  const email = session.user?.email || '';
  const balance = session.user?.balance ?? 0;
  const subscriptionActive = session.user?.subscription_active ?? false;
  const avatarSrc = !avatarError
    ? session.user?.image || '/images/profile.png'
    : '';
  const initials = (email || 'U').slice(0, 1).toUpperCase();
  // Client-side nickname validation: disallow uppercase
  const hasUppercaseInNickname = nickname !== nickname.toLowerCase();

  const saveNickname = async () => {
    setNickMsg(null);
    const value = String(nickname || '').trim();
    if (!value) {
      setNickMsg('Введите никнейм');
      return;
    }
    if (value.length > 64) {
      setNickMsg('Никнейм слишком длинный (макс. 64)');
      return;
    }
    if (value !== value.toLowerCase()) {
      setNickMsg('Никнейм должен быть в нижнем регистре (без заглавных)');
      return;
    }
    try {
      setNickSaving(true);
      const res = await fetch('/api/profile/nickname', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) setNickMsg('Такой ник уже занят');
        else if (res.status === 400 && data?.error === 'nickname_empty')
          setNickMsg('Введите никнейм');
        else if (res.status === 400 && data?.error === 'nickname_uppercase')
          setNickMsg('Никнейм должен быть в нижнем регистре (без заглавных)');
        else setNickMsg('Ошибка сохранения, попробуйте позже');
        return;
      }
      setNickMsg('Сохранено');
      // reflect locally
      setNickname(String(data?.nickname || value));

      // Refresh page to update any task completion status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      setNickMsg('Ошибка сети, попробуйте позже');
    } finally {
      setNickSaving(false);
    }
  };

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header (matches main) */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold">
            Aporto
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10 transition-colors"
            >
              Главная
            </Link>
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10 transition-colors"
            >
              Чат
            </Link>
          </nav>
          <div>
            {session?.user?.type === 'guest' ? (
              <Link href="/login" className="modern-btn-cta">
                Вход
              </Link>
            ) : (
              <Link
                href="/"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 md:px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:opacity-95 transition"
              >
                В чат
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero (matches main tone) */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                  Профиль
                </div>
                <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  Ваш аккаунт Aporto
                </h1>
                <p className="mt-3 text-neutral-300 max-w-2xl">
                  Управляйте подпиской, балансом токенов и платежами. Все
                  настройки в одном месте.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                  onClick={() => setShowProModal(true)}
                >
                  Оформить ПРО
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 hover:bg-white/10 px-5 py-3 text-sm font-semibold transition-colors"
                  onClick={() => {
                    const el = document.getElementById('balance');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Пополнить баланс
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
          {/* Профиль пользователя */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4 min-w-[220px]">
              {!avatarError && avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Аватар"
                  width={112}
                  height={112}
                  className="size-28 rounded-full border-4 border-indigo-600 shadow-lg object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="size-28 rounded-full border-4 border-indigo-600 shadow-lg bg-indigo-900/40 flex items-center justify-center text-3xl font-bold text-indigo-200 select-none">
                  {initials}
                </div>
              )}
              <div className="text-center md:text-left">
                <div className="font-extrabold text-2xl text-white">
                  {email}
                </div>
                <div className="text-indigo-400 text-base rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1 inline-block mt-2">
                  {subscriptionActive
                    ? 'PRO-подписка активна'
                    : 'Базовый тариф'}
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span
                  className={`rounded-xl px-6 py-3 font-semibold text-lg border ${
                    subscriptionActive
                      ? 'bg-gradient-to-r from-green-600 to-indigo-700 text-white border-green-600'
                      : 'border-white/10 bg-white/[0.02] text-neutral-300'
                  }`}
                >
                  Тариф: {subscriptionActive ? 'PRO' : 'Базовый'}
                </span>
                {!subscriptionActive && (
                  <button
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 text-lg font-semibold shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity w-full sm:w-auto"
                    onClick={() => setShowProModal(true)}
                  >
                    Улучшить до ПРО
                  </button>
                )}
                {subscriptionActive && (
                  <button
                    type="button"
                    className="rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-6 py-3 text-sm font-medium transition-colors w-full sm:w-auto disabled:opacity-50"
                    onClick={handleCancelSubscription}
                    disabled={isCancelingSubscription}
                  >
                    {isCancelingSubscription
                      ? 'Отменяем...'
                      : 'Отменить подписку и отвязать карту'}
                  </button>
                )}
              </div>
              <div className="text-neutral-400 text-base mt-2">
                Подпишись на ПРО и получай <b>1000 токенов</b> в месяц всего за{' '}
                <b>199 ₽</b> (≈0.2 ₽ за токен).
              </div>
            </div>
          </section>

          {/* Описание профиля */}
          <section className="rounded-3xl border border-white/10 p-4 md:p-8 bg-white/[0.04]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">
                  Описание профиля
                </h2>
                <p className="text-neutral-300 whitespace-pre-wrap min-h-[48px] break-words leading-relaxed">
                  {bio
                    ? bio
                    : 'Добавьте описание вашего профиля, чтобы пользователи знали больше о вас.'}
                </p>
                {bioMsg && (
                  <div className="mt-2 text-sm text-neutral-300">{bioMsg}</div>
                )}
              </div>
              <div className="shrink-0">
                <AlertDialog
                  data-component="ProfileBioAlertDialog"
                  open={bioModalOpen}
                  onOpenChange={(v) => {
                    // eslint-disable-next-line no-console
                    console.log('[ProfilePage] onOpenChange ->', v);
                    setBioModalOpen(v);
                    if (v) setBioMsg(null);
                  }}
                >
                  <button
                    type="button"
                    data-testid="bio-edit-trigger"
                    onClick={() => {
                      // eslint-disable-next-line no-console
                      console.log(
                        '[ProfilePage] bio edit trigger clicked -> set open true',
                      );
                      setBioModalOpen(true);
                    }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 hover:bg-white/10 px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Редактировать
                  </button>
                  <AlertDialogContent
                    data-testid="bio-edit-content"
                    onOpenAutoFocus={() => {
                      // eslint-disable-next-line no-console
                      console.log('[AlertDialogContent] onOpenAutoFocus');
                    }}
                    onEscapeKeyDown={() => {
                      // eslint-disable-next-line no-console
                      console.log('[AlertDialogContent] onEscapeKeyDown');
                    }}
                    onCloseAutoFocus={() => {
                      // eslint-disable-next-line no-console
                      console.log('[AlertDialogContent] onCloseAutoFocus');
                    }}
                    className="relative max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl"
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        Редактировать описание профиля
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Максимум 200 символов. Это описание отображается в вашем
                        профиле.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="mt-2">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        data-testid="bio-textarea"
                        autoFocus
                        className="w-full min-h-[140px] rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Добавьте описание (до 200 символов)"
                        maxLength={200}
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                        <span>{bio.length}/200</span>
                        {bioMsg && (
                          <span
                            className={
                              /Ошибка|Слишком/i.test(bioMsg)
                                ? 'text-red-400'
                                : 'text-neutral-400'
                            }
                          >
                            {bioMsg}
                          </span>
                        )}
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        data-testid="bio-cancel"
                        className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200"
                      >
                        Отменить
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="bio-save"
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                          bioSaving
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95'
                        }`}
                        onClick={saveBio}
                        disabled={bioSaving}
                      >
                        {bioSaving ? 'Сохранение...' : 'Сохранить'}
                      </AlertDialogAction>
                    </AlertDialogFooter>

                    {bioSaving && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      </div>
                    )}
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>

          {/* Никнейм */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04]">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Никнейм</h2>
                <p className="text-neutral-400 mb-4">
                  Установите отображаемое имя для вашего профиля.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Ваш никнейм"
                    maxLength={64}
                  />
                  <button
                    type="button"
                    onClick={saveNickname}
                    disabled={nickSaving || hasUppercaseInNickname}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      nickSaving
                        ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95'
                    }`}
                  >
                    {nickSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
                {hasUppercaseInNickname && (
                  <div className="mt-2 text-sm text-red-400">
                    Никнейм должен быть в нижнем регистре (без заглавных)
                  </div>
                )}
                {nickMsg && (
                  <div className="mt-2 text-sm text-neutral-300">{nickMsg}</div>
                )}
              </div>
            </div>
          </section>

          {/* Пароль */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04]">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">
                  Смена пароля
                </h2>
                <p className="text-neutral-400 mb-4">
                  Сначала введите текущий пароль (если он установлен), затем
                  новый.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Текущий пароль"
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Новый пароль (мин. 8)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600"
                      placeholder="Повторите пароль"
                    />
                    <button
                      type="button"
                      onClick={savePassword}
                      disabled={passSaving}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap transition ${
                        passSaving
                          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95'
                      }`}
                    >
                      {passSaving ? 'Сохранение...' : 'Обновить'}
                    </button>
                  </div>
                </div>
                {passMsg && (
                  <div className="mt-2 text-sm text-neutral-300">{passMsg}</div>
                )}
              </div>
            </div>
          </section>

          {/* Баланс */}
          <section
            id="balance"
            className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1 flex flex-col gap-4">
              <div className="font-bold text-xl text-white mb-2">
                Баланс токенов
              </div>
              <div className="flex items-center gap-6 mb-4">
                <span className="text-3xl font-extrabold text-white rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-8 py-4 shadow-lg shadow-indigo-600/20">
                  {balance}
                </span>
              </div>
              <div className="text-neutral-400 text-base mb-2">
                Токены тратятся на запросы к наиболее мощным моделям. Следи за
                балансом, чтобы всегда иметь к ним доступ.
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <select
                  className="rounded-xl border border-white/10 bg-white/[0.02] text-neutral-200 px-4 py-3 min-w-[260px]"
                  value={selected.label}
                  onChange={(e) =>
                    setSelected(
                      packages.find((p) => p.label === e.target.value) ||
                        packages[0],
                    )
                  }
                >
                  {packages.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`text-lg px-6 py-3 w-auto min-w-[200px] transition font-semibold rounded-xl flex items-center justify-center gap-2 whitespace-nowrap shadow-lg ${
                    isProcessingCoinsPayment
                      ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-indigo-600/20 hover:opacity-95'
                  }`}
                  onClick={handleCoinsPurchase}
                  disabled={isProcessingCoinsPayment}
                >
                  {isProcessingCoinsPayment ? (
                    <>
                      <svg
                        className="animate-spin size-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Обработка...
                    </>
                  ) : (
                    `Купить за ${selected.price} ₽`
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-lg text-neutral-300 text-center">
                <b>Потратьте Токены </b> на доступ к GPT-4, Claude, DeepSeek,
                Grok и другим топовым моделям!
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Модальное окно PRO */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-neutral-800 relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-2xl text-neutral-400 hover:text-red-500 transition"
              onClick={() => setShowProModal(false)}
              aria-label="Закрыть"
            >
              &times;
            </button>

            <h3 className="text-2xl font-bold mb-6 text-white">
              Приобрести подписку ПРО
            </h3>

            <form onSubmit={handleProUpgrade} className="space-y-4">
              {/* Согласие с офертой */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={consents.offer}
                    onChange={() => handleConsentChange('offer')}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 border-2 rounded transition ${
                      consents.offer
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-600 group-hover:border-indigo-400'
                    }`}
                  >
                    {consents.offer && (
                      <svg
                        className="size-3 text-white m-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-neutral-200 text-sm leading-relaxed">
                  Соглашаюсь с{' '}
                  <Link
                    href="/tos-subscription"
                    target="_blank"
                    className="text-indigo-400 underline hover:text-indigo-300"
                  >
                    договором оферты
                  </Link>
                  .
                </span>
              </label>

              {/* Согласие на обработку персональных данных */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={consents.personal}
                    onChange={() => handleConsentChange('personal')}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 border-2 rounded transition ${
                      consents.personal
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-600 group-hover:border-indigo-400'
                    }`}
                  >
                    {consents.personal && (
                      <svg
                        className="size-3 text-white m-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-neutral-200 text-sm leading-relaxed">
                  Даю своё согласие на обработку персональных данных.
                </span>
              </label>

              {/* Согласие на рекуррентные платежи */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={consents.recurring}
                    onChange={() => handleConsentChange('recurring')}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 border-2 rounded transition ${
                      consents.recurring
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-600 group-hover:border-indigo-400'
                    }`}
                  >
                    {consents.recurring && (
                      <svg
                        className="size-3 text-white m-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-neutral-200 text-sm leading-relaxed">
                  Соглашаюсь с рекуррентными платежами. Первое списание — 199
                  руб. в день подписки и далее 199 руб. согласно тарифу раз в
                  месяц.
                </span>
              </label>

              {/* Согласие с политикой конфиденциальности */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={consents.privacy}
                    onChange={() => handleConsentChange('privacy')}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 border-2 rounded transition ${
                      consents.privacy
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-600 group-hover:border-indigo-400'
                    }`}
                  >
                    {consents.privacy && (
                      <svg
                        className="size-3 text-white m-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-neutral-200 text-sm leading-relaxed">
                  Подтверждаю, что ознакомился и соглашаюсь с{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-indigo-400 underline hover:text-indigo-300"
                  >
                    политикой конфиденциальности
                  </Link>
                  , и не являюсь получателем регулярных денежных выплат,
                  предусмотренных Указами Президента РФ.
                </span>
              </label>

              <button
                type="submit"
                disabled={
                  !Object.values(consents).every(Boolean) || isProcessingPayment
                }
                className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition mt-6 flex items-center justify-center gap-2 ${
                  Object.values(consents).every(Boolean) && !isProcessingPayment
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isProcessingPayment ? (
                  <>
                    <svg
                      className="animate-spin size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Создание платежа...
                  </>
                ) : (
                  'Оплатить 199 ₽'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto p-6">
          <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-3">
            <Link
              href="/privacy"
              className="text-neutral-300 hover:text-indigo-300 hover:underline"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/tos"
              className="text-neutral-300 hover:text-indigo-300 hover:underline"
            >
              Пользовательское соглашение
            </Link>
            <Link
              href="/tos-subscription"
              className="text-neutral-300 hover:text-indigo-300 hover:underline"
            >
              Соглашение с подпиской
            </Link>
            <a
              href="mailto:hey@aporto.tech"
              className="text-neutral-300 hover:text-indigo-300 hover:underline"
            >
              Связаться с нами
            </a>
          </nav>
          <div className="text-center text-neutral-400 text-xs">
            © 2025 Aporto
          </div>
        </div>
      </footer>
    </div>
  );
}
