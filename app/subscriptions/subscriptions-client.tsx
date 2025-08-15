'use client';

import Link from 'next/link';
import { useState } from 'react';

type Plan = {
  id: string;
  title: string;
  credits: string;
  price: string;
  priceNote?: string;
  pricePer?: string;
  badges: string[];
  features: { text: string; available: boolean }[];
  cta: { label: string; href: string };
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'basic',
    title: 'Базовый',
    credits: '',
    price: 'Бесплатно',
    priceNote: '',
    pricePer: '',
    badges: [],
    features: [
      { text: 'Чат с нейросетью', available: true },
      { text: 'Цифровое видение', available: true },
      {
        text: 'GPT‑4o Mini, GPT‑5 Mini, Qwen3 235B, GLM‑4.5 Air, Mistral Medium 3.1, MiniMax M1, Gemini 2.5 FL',
        available: true,
      },
      { text: '1000 токенов ежемесячно', available: false },
      { text: 'Приоритетная поддержка', available: false },
      { text: 'Запросы на новые функции', available: false },
      { text: 'Бесплатные консультации', available: false },
      { text: 'Отсутствие рекламы', available: false },
    ],
    cta: { label: 'Попробовать сейчас', href: '/' },
  },
  {
    id: 'pro',
    title: 'ПРО-аккаунт',
    credits: '',
    price: '199₽ в месяц',
    priceNote: '',
    pricePer: '',
    badges: [],
    features: [
      { text: 'Чат с нейросетью', available: true },
      { text: 'Цифровое видение', available: true },
      {
        text: 'GPT‑4.1, GPT‑5 Chat, GPT o3, GPT o3‑mini, GPT o1‑mini, GPT o4‑mini, Claude Sonnet 4, Claude 3.7 Sonnet, Gemini 2.5 PRO, Gemini 2.5 Flash, Grok 3, Grok 3 Mini, Grok 4',
        available: true,
      },
      { text: '1000 токенов ежемесячно', available: true },
      { text: 'Приоритетная поддержка', available: true },
      { text: 'Запросы на новые функции', available: true },
      { text: 'Бесплатные консультации', available: true },
      { text: 'Отсутствие рекламы', available: true },
    ],
    cta: { label: 'Оформить подписку', href: '/payment/pro' },
    popular: true,
  },
];

export default function SubscriptionsClient() {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [showProModal, setShowProModal] = useState(false);
  const [consents, setConsents] = useState({
    offer: false,
    personal: false,
    recurring: false,
    privacy: false,
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleConsentChange = (type: keyof typeof consents) => {
    setConsents((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

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

  const handlePlanAction = (plan: Plan) => {
    if (plan.id === 'pro') {
      setShowProModal(true);
    } else {
      // Для базового плана переходим в чат
      window.location.href = plan.cta.href;
    }
  };

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold">
            Aporto
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-neutral-200 hover:text-white transition-colors"
            >
              Назад
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Тарифные планы
          </h1>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 justify-items-center max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 transition-all hover:scale-105 ${
                plan.popular
                  ? 'border-green-500 bg-gradient-to-b from-green-500/10 to-transparent'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.title}</h3>
                <p className="text-neutral-400 text-sm mb-4">{plan.credits}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.priceNote && (
                    <span className="text-neutral-400 ml-1">
                      {plan.priceNote}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-400">{plan.pricePer}</p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.badges.map((badge) => (
                  <div
                    key={badge}
                    className="text-xs text-neutral-300 bg-white/5 rounded-lg p-3"
                  >
                    {badge}
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-8">
                {plan.features.map((feature) => (
                  <div
                    key={feature.text}
                    className="flex items-center gap-2 text-sm"
                  >
                    {feature.available ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-neutral-400">✗</span>
                    )}
                    <span className="text-neutral-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                onClick={() => handlePlanAction(plan)}
              >
                {plan.cta.label}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Pro Modal */}
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
    </div>
  );
}
