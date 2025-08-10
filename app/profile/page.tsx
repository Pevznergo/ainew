'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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

  // Состояние для модального окна PRO
  const [showProModal, setShowProModal] = useState(false);
  const [consents, setConsents] = useState({
    offer: false,
    personal: false,
    recurring: false,
    privacy: false,
  });

  const handleConsentChange = (type: keyof typeof consents) => {
    setConsents((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
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

  return (
    <div className="font-geist font-sans bg-[#0b0b0f] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-lg"
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
              className="flex items-center font-bold text-3xl text-white tracking-tight"
            >
              Aporto
            </Link>
          </div>
          <div>
            {session?.user?.type === 'guest' && (
              <Link href="/login" className="modern-btn-cta">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* Профиль пользователя */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4 min-w-[220px]">
              <Image
                src="/images/profile.png"
                alt="Аватар"
                width={112}
                height={112}
                className="size-28 rounded-full border-4 border-indigo-600 shadow-lg object-cover"
              />
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
                <b>199 рублей</b> (0.2 ₽ за 1 токен).
              </div>
            </div>
          </section>

          {/* Баланс */}
          <section className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="font-bold text-xl text-white mb-2">
                Баланс токенов
              </div>
              <div className="flex items-center gap-6 mb-4">
                <span className="text-3xl font-extrabold text-indigo-400 rounded-xl border border-white/10 bg-white/[0.02] px-7 py-3 shadow">
                  {balance}
                </span>
              </div>
              <div className="text-neutral-400 text-base mb-2">
                Токены тратятся на запросы к наиболее мощным моделям. Следи за
                балансом, чтобы всегда иметь к ним доступ.
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Кастомный dropdown */}
                <div className="relative w-full max-w-md" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex justify-between items-center w-full rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-white text-base focus:ring-2 focus:ring-indigo-600 transition cursor-pointer"
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    style={{ minWidth: 360 }}
                  >
                    <span className="truncate">
                      {selected.label}{' '}
                      <span className="text-neutral-400 text-xs">
                        ({selected.pricePer} ₽/токен)
                      </span>
                    </span>
                    <svg
                      className={`ml-2 size-5 transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {open && (
                    <ul
                      className="absolute z-20 w-full rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur shadow-lg max-h-60 overflow-auto bottom-full mb-2"
                      tabIndex={-1}
                      style={{ minWidth: 320 }}
                    >
                      {packages.map((pkg) => (
                        <li
                          key={pkg.label}
                          className={`px-5 py-3 cursor-pointer hover:bg-white/10 transition flex justify-between items-center ${
                            selected.label === pkg.label
                              ? 'bg-indigo-600 text-white'
                              : 'text-white'
                          }`}
                          onClick={() => {
                            setSelected(pkg);
                            setOpen(false);
                          }}
                        >
                          <span>{pkg.label}</span>
                          <span className="text-xs text-neutral-400 ml-2">
                            {pkg.pricePer} ₽/токен
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  className={`text-lg px-6 py-3 w-auto min-w-[200px] transition font-semibold rounded-lg flex items-center justify-center gap-2 whitespace-nowrap ${
                    isProcessingCoinsPayment
                      ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      : 'modern-btn-outline'
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

      <footer className="mt-12 pb-4">
        <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Политика конфиденциальности
          </Link>
          <Link href="/tos" className="text-indigo-400 hover:underline">
            Пользовательское соглашение
          </Link>
          <Link
            href="/tos-subscription"
            className="text-indigo-400 hover:underline"
          >
            Соглашение с подпиской
          </Link>
          <a
            href="mailto:hey@aporto.tech"
            className="text-indigo-400 hover:underline"
          >
            Связаться с нами
          </a>
        </nav>
        <div className="text-center text-neutral-500 text-sm"> 2025</div>
      </footer>
    </div>
  );
}
