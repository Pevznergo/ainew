'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { sendGTMEvent } from '@/lib/gtm';
import { useDemo } from '@/hooks/use-demo';

// Fallback данные, если БД недоступна
const defaultTypewriterTexts = [
  'Расскажи про историческое событие',
  'Напиши код на Python',
  'Создай презентацию',
  'Проверь исторический факт',
];

const defaultFeaturesData = [
  {
    title: 'Исторические исследования',
    h3: 'Глубокий анализ исторических событий и личностей',
    p: 'Задайте любой вопрос об истории, и мой ИИ найдет интересные факты, малоизвестные детали и поможет разобраться в сложных исторических событиях. От древних цивилизаций до современности.',
    video: '/images/case1.mp4',
    poster: '/images/case1.jpg',
  },
  {
    title: 'Программирование и код',
    h3: 'Помощь с программированием на любых языках',
    p: 'Получите помощь с программированием на Python, JavaScript, Java и других языках. От простых скриптов до сложных алгоритмов. ИИ объяснит код, найдет ошибки и предложит оптимизации.',
    video: '/images/case2.mp4',
    poster: '/images/case2.jpg',
  },
  {
    title: 'Создание контента',
    h3: 'Генерация текстов, презентаций и документов',
    p: 'Создавайте статьи, посты, сценарии, презентации и любой другой контент. ИИ поможет с идеями, структурой и стилем. Поддерживает все популярные форматы и языки.',
    video: '/images/case3.mp4',
    poster: '/images/case3.jpg',
  },
  {
    title: 'Анализ данных',
    h3: 'Обработка и анализ любой информации',
    p: 'Загружайте файлы, таблицы и документы. ИИ проанализирует данные, найдет закономерности, создаст отчеты и поможет принять обоснованные решения. Работает с любыми форматами.',
    video: '/images/case4.mp4',
    poster: '/images/case4.jpg',
  },
  {
    title: 'Универсальный помощник',
    h3: 'Решение любых задач с текстом и изображениями',
    p: 'От изучения истории до создания кода, от анализа данных до генерации контента. Мой ИИ адаптируется под ваши задачи и помогает с любыми вопросами. Просто опишите, что нужно.',
    video: '/images/case5.mp4',
    poster: '/images/case5.jpg',
  },
];

const models = [
  'GPT-4o Mini',
  'GPT-4.1',
  'GPT o3 2025',
  'GPT o3-mini-high',
  'GPT o1-mini',
  'GPT o4-mini',
  'Claude Sonnet 4',
  'Claude 3.7 Sonnet',
  'Gemini 2.5 PRO',
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash Lite',
  'Grok 3',
  'Grok 3 Mini',
  'Grok 4',
  'Grok 4 Mini',
  'DALL-E 3',
  'Midjourney',
  'Flux-1.1 Pro',
  'Stable Diffusion',
  'Leonardo AI',
];

// Компонент скелетона для загрузки
function LoadingSkeleton() {
  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-neutral-700 rounded-full animate-pulse" />
            <div className="w-32 h-8 bg-neutral-700 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-neutral-700 rounded animate-pulse" />
        </div>
      </header>

      <main className="px-6">
        <div className="flex-1 w-full max-w-6xl mx-auto py-10">
          {/* Hero skeleton */}
          <section className="mb-20">
            <div className="flex flex-col items-center justify-center text-center px-4 py-6 md:py-12 space-y-8">
              <div className="size-36 bg-neutral-700 rounded-full animate-pulse" />
              <div className="w-96 h-16 bg-neutral-700 rounded animate-pulse" />
              <div className="w-80 h-8 bg-neutral-700 rounded animate-pulse" />
              <div className="w-48 h-12 bg-neutral-700 rounded animate-pulse" />
            </div>
          </section>

          {/* Models skeleton */}
          <section className="mb-20 py-20">
            <div className="text-center mb-16">
              <div className="w-96 h-12 bg-neutral-700 rounded animate-pulse mx-auto mb-8" />
              <div className="w-4xl h-8 bg-neutral-700 rounded animate-pulse mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={`skeleton-${Date.now()}-${i}`}
                  className="h-20 bg-neutral-700 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function MainPageClient() {
  const demoData = useDemo();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Typewriter state
  const [typeIndex, setTypeIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [tab, setTab] = useState(0);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement & { elements: any };
    const name = (form.elements.namedItem('contact-name') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('contact-email') as HTMLInputElement)?.value;
    const phone = (form.elements.namedItem('contact-phone') as HTMLInputElement)?.value;
    const message = (form.elements.namedItem('contact-message') as HTMLTextAreaElement)?.value;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      await res.json();
      setFormSuccess(true);
    } catch (err) {
      alert('Ошибка при отправке. Попробуйте ещё раз.');
    }
  };

  // Promo banner
  const [showPromo, setShowPromo] = useState(true);

  // Typewriter с данными из БД - обернуто в useMemo для стабильности зависимостей
  const typewriterTexts = useMemo(() => {
    return demoData
      ? [
          demoData.typewriterText1 || 'Расскажи про историческое событие',
          demoData.typewriterText2 || 'Напиши код на Python',
          demoData.typewriterText3 || 'Создай презентацию',
          demoData.typewriterText4 || 'Проверь исторический факт',
        ]
      : defaultTypewriterTexts;
  }, [demoData]);

  useEffect(() => {
    // Задержка в 500мс перед началом печатания
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, 500);

    return () => clearTimeout(startTimeout);
  }, []);

  useEffect(() => {
    if (!isStarted) return;

    let timeout: NodeJS.Timeout;
    const current = typewriterTexts[typeIndex];
    if (!isDeleting) {
      if (charIndex < current.length) {
        timeout = setTimeout(() => setCharIndex(charIndex + 1), 90);
        setDisplayed(current.slice(0, charIndex + 1));
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 1200);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => setCharIndex(charIndex - 1), 40);
        setDisplayed(current.slice(0, charIndex - 1));
      } else {
        setIsDeleting(false);
        setTypeIndex((typeIndex + 1) % typewriterTexts.length);
        timeout = setTimeout(() => {}, 400);
      }
    }
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, typeIndex, typewriterTexts, isStarted]);

  useEffect(() => {
    const referralCode = searchParams.get('ref');

    if (referralCode) {
      console.log('Saving referral code:', referralCode);
      localStorage.setItem('referralCode', referralCode);
    }
  }, [searchParams]);

  // Показываем скелетон только если нет данных И мы на демо-странице
  if (!demoData && pathname.startsWith('/my/')) {
    return <LoadingSkeleton />;
  }

  // Features с данными из БД для первого элемента
  const featuresData = [
    {
      title: demoData?.features1_title || 'Исторические исследования',
      h3:
        demoData?.features1_h3 ||
        'Глубокий анализ исторических событий и личностей',
      p:
        demoData?.features1_p ||
        'Задайте любой вопрос об истории, и мой ИИ найдет интересные факты, малоизвестные детали и поможет разобраться в сложных исторических событиях. От древних цивилизаций до современности.',
      video: '/images/case1.mp4',
      poster: '/images/case1.jpg',
    },
    ...defaultFeaturesData.slice(1), // Остальные features остаются как есть
  ];

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={demoData?.logo_url || '/demo/minaev.png'}
                alt={demoData?.logo_name || 'Сергей Минаев'}
                width={48}
                height={48}
                className="rounded-full object-cover"
                priority // Добавляем приоритет для критических изображений
              />
              <div className="absolute inset-0 rounded-full bg-black/30" />
            </div>
            <div>
              <Link
                href="/"
                className="flex items-center font-bold text-2xl text-white"
              >
                {demoData?.logo_name || 'Сергей Минаев'}
              </Link>
            </div>
          </div>
          <nav>
            <Link
              href="/"
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
              onClick={() => {
                if (typeof window !== 'undefined' && window.dataLayer) {
                  sendGTMEvent('click_open_chat', {
                    event_category: 'engagement',
                    event_label: 'header_cta',
                    location: 'header',
                  });
                }
              }}
            >
              Попробовать бесплатно
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-6">
        <div className="flex-1 w-full max-w-6xl mx-auto py-10">
          {/* Hero */}
          <section className="mb-20">
            <div className="flex flex-col items-center justify-center text-center px-4 py-6 md:py-12 space-y-8">
              {/* Фото блогера */}
              <div className="relative mb-4">
                <Image
                  src={demoData?.logo_url || '/demo/minaev.jpg'}
                  alt={demoData?.logo_name || 'Сергей Минаев'}
                  width={150}
                  height={150}
                  className="rounded-full object-cover border-4 border-indigo-500/30 shadow-2xl"
                  priority // Добавляем приоритет
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent" />
              </div>

              {/* КРИТИЧЕСКИЙ КОНТЕНТ - рендерим сразу */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                ИИ ассистент блогера
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-2 leading-tight">
                {demoData?.hero_title || 'Мой ИИ-помощник'}
              </h1>

              {/* Typewriter - рендерим сразу с fallback */}
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white whitespace-nowrap">
                    {isStarted ? displayed : ''}
                  </span>
                  <span className="typewriter-cursor text-indigo-400 animate-pulse text-2xl sm:text-3xl md:text-4xl">
                    |
                  </span>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl text-neutral-300 mt-2">
                  {demoData?.hero_subtitle ||
                    'История • Программирование • Контент • Анализ'}
                  <br />
                  <span className="block mt-2 text-xl sm:text-2xl">
                    <span className="text-indigo-400 font-bold">GPT</span> ,{' '}
                    <span className="text-indigo-400 font-bold">Claude</span> ,{' '}
                    <span className="text-indigo-400 font-bold">Gemini</span> ,{' '}
                    <span className="text-indigo-400 font-bold">Grok</span> ,{' '}
                    <span className="text-indigo-400 font-bold">Mistral</span>
                  </span>
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/"
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 text-lg shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.dataLayer) {
                      sendGTMEvent('click_open_chat', {
                        event_category: 'engagement',
                        event_label: 'hero_cta',
                        location: 'hero_section',
                      });
                    }
                  }}
                >
                  Начать бесплатно
                </Link>
              </div>
            </div>
          </section>

          {/* Promo banner */}
          {showPromo && (
            <Link
              href="/invite"
              className="fixed top-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-2xl rounded-2xl flex items-center gap-4 px-6 py-4 border-2 border-purple-400 max-w-xs cursor-pointer transition-all duration-300 hover:shadow-3xl hover:scale-105 hover:border-purple-300"
              style={{ textDecoration: 'none' }}
              tabIndex={0}
              aria-label="Промо: эксклюзивный доступ к ИИ"
              onClick={() => {
                sendGTMEvent('click_promo_banner', {
                  event_category: 'engagement',
                  event_label: 'promo_banner',
                  promo_type: 'exclusive_access',
                });
              }}
            >
              <button
                className="absolute top-2 right-2 text-2xl text-white hover:text-red-300 z-10 transition-colors"
                aria-label="Закрыть"
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPromo(false);
                }}
              >
                &times;
              </button>
              <Image
                src="/images/gift100.png"
                alt="Эксклюзив"
                width={40}
                height={40}
                style={{ minWidth: 40, minHeight: 40 }}
              />
              <div>
                <div className="font-bold text-base text-white">
                  Эксклюзивный доступ к ИИ
                </div>
                <div className="text-xs mt-1 text-purple-200 underline">
                  Только сегодня
                </div>
              </div>
            </Link>
          )}

          {/* Models Section */}
          <section className="mb-20 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                {demoData.models_title || 'Доступные модели'}
              </h2>
              <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
                {demoData.models_subtitle ||
                  'Используйте лучшие ИИ-модели для изучения истории. От простых вопросов до глубокого анализа.'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {models.map((model, index) => (
                <div
                  key={model}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center hover:border-indigo-500/50 transition-colors"
                >
                  <div className="text-indigo-400 font-semibold text-sm">
                    {model}
                  </div>
                  <div className="text-neutral-400 text-xs mt-1">
                    {index < 2 ? 'Бесплатно' : 'PRO'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="min-h-screen flex flex-col justify-center py-20">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                {demoData.features_title || 'Что умеет мой ИИ'}
              </h2>
              <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
                {demoData.features_subtitle ||
                  'Универсальный помощник для изучения истории и решения любых задач'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {featuresData.map((f, i) => (
                <button
                  key={f.title}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors border border-white/10 ${
                    tab === i
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white'
                      : 'bg-white/[0.04] text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setTab(i)}
                  type="button"
                >
                  {f.title}
                </button>
              ))}
            </div>
            <div className="flex flex-col lg:flex-row gap-16 items-center px-4 max-w-7xl mx-auto">
              <div className="flex-1 space-y-6">
                <h3 className="text-3xl font-bold mb-6 text-white">
                  {featuresData[tab].h3}
                </h3>
                <p className="text-neutral-300 text-xl leading-relaxed">
                  {featuresData[tab].p}
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                <video
                  src={featuresData[tab].video}
                  poster={featuresData[tab].poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="rounded-3xl max-w-full shadow-2xl border border-white/10"
                  style={{ maxHeight: 400, background: '#222' }}
                />
              </div>
            </div>
          </section>

          {/* Plans */}
          <section id="pricing" className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Выберите ваш уровень доступа к ИИ
              </h2>
              <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto justify-items-center">
                {/* Базовый */}
                <div className="rounded-3xl border p-8 bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 hover:scale-[1.02] border-white/10">
                  <div className="text-xl font-semibold text-white mb-2">Базовый</div>
                  <div className="text-3xl font-bold text-white">Бесплатно</div>
                  <ul className="mt-6 space-y-2 text-neutral-300">
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Чат с нейросетью</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Цифровое видение</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">GPT-4 mini, Gemini 2 Flash</span>
                    </li>
                  </ul>
                  <Link
                    href="/register"
                    className="mt-8 inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                    onClick={() => {
                      sendGTMEvent('click_plan_cta', {
                        event_category: 'engagement',
                        event_label: 'basic_plan',
                        plan_type: 'basic',
                        location: 'pricing_section',
                      });
                    }}
                  >
                    Попробовать сейчас
                  </Link>
                </div>
                {/* ПРО */}
                <div className="rounded-3xl border p-8 bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 hover:scale-[1.02] border-green-500 shadow-lg shadow-green-500/20">
                  <div className="text-xl font-semibold text-white mb-2">ПРО-аккаунт</div>
                  <div className="text-3xl font-bold text-white">199₽ в месяц</div>
                  <ul className="mt-6 space-y-2 text-neutral-300">
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Чат с нейросетью</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Цифровое видение</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">GPT 5, Claude, Grok, Gemini и др.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">1000 токенов ежемесячно</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Приоритетная поддержка</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Запросы на новые функции</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Бесплатные консультации</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400">✓</span>
                      <span className="capitalize">Отсутствие рекламы</span>
                    </li>
                  </ul>
                  <Link
                    href="/register"
                    className="mt-8 inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                    onClick={() => {
                      sendGTMEvent('click_plan_cta', {
                        event_category: 'engagement',
                        event_label: 'pro_plan',
                        plan_type: 'pro',
                        location: 'pricing_section',
                      });
                    }}
                  >
                    Оформить подписку
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Corporate */}
          <section className="px-6 pb-12">
            <div className="max-w-7xl mx-auto rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Решения для команд и партнеров
                  </h3>
                  <p className="text-neutral-300 mt-2 max-w-3xl">
                    Подключите ИИ-помощника для вашей команды: обучение, редакция, ресерч, код. Индивидуальные условия и интеграции.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                >
                  Оставить заявку
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {['Обучение команды под ключ', 'Интеграция в рабочие процессы', 'Поддержка и SLA'].map((b) => (
                  <li
                    key={`corp-${b}`}
                    className="rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-200"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="px-6 pb-16">
            <div className="max-w-7xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-6">Частые вопросы</h3>
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0f1016]/60">
                {[
                  { q: 'Это действительно ИИ-помощник?', a: 'Да. Используются современные модели (GPT, Claude, Gemini и др.) для генерации ответов и анализа изображений/текста.' },
                  { q: 'Сколько стоит подписка?', a: 'Базовый — бесплатно. ПРО-аккаунт — 199₽ в месяц, включает 1000 токенов и расширенные возможности.' },
                  { q: 'Можно ли отменить подписку?', a: 'Да, вы можете отменить в любой момент. Доступ сохранится до конца оплаченного периода.' },
                ].map((f) => (
                  <details key={`faq-${f.q}`} className="group">
                    <summary className="flex list-none cursor-pointer select-none items-center justify-between px-5 py-4 text-left text-neutral-200 hover:bg-white/5">
                      <span className="font-medium pr-4">{f.q}</span>
                      <span className="ml-auto text-neutral-400 transition-transform group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-5 pb-5 text-neutral-300 whitespace-pre-line">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="support" className="px-6 pb-16">
            <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h3 className="text-3xl font-bold text-white mb-2">Связаться с нами</h3>
              <p className="text-neutral-300 mb-6">Оставьте заявку — поможем внедрить ИИ под ваши задачи.</p>
              {formSuccess ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="inline-flex items-center justify-center size-20 bg-green-500/20 rounded-full mb-6 animate-bounce">
                    <svg className="size-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Заявка отправлена!</h3>
                  <p className="text-neutral-300 mb-8 text-lg">Мы получили вашу заявку и свяжемся с вами в ближайшее время.</p>
                  <button
                    type="button"
                    onClick={() => setFormSuccess(false)}
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Отправить ещё одну заявку
                  </button>
                </div>
              ) : (
                <form className="grid gap-4" onSubmit={handleFormSubmit}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm text-neutral-300 mb-1">Имя</label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="Имя"
                        className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm text-neutral-300 mb-1">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="Email"
                        className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm text-neutral-300 mb-1">Телефон</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="Телефон"
                      className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm text-neutral-300 mb-1">Сообщение</label>
                    <textarea
                      id="contact-message"
                      required
                      placeholder="Коротко опишите задачу"
                      className="w-full min-h-28 rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                  >
                    Отправить
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
      <footer className="px-6 py-8 border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
            <Link href="/tos" className="text-neutral-300 hover:underline">
              Публичная оферта
            </Link>
            <Link href="/privacy" className="text-neutral-300 hover:underline">
              Политика конфиденциальности
            </Link>
            <Link href="/tos-subscription" className="text-neutral-300 hover:underline">
              Соглашение с подпиской
            </Link>
            <a href="mailto:hey@aporto.tech" className="text-neutral-300 hover:underline">
              Связаться с нами
            </a>
          </nav>
          <div className="text-neutral-500 text-sm">
            ОГРНИП 318774611605815 · ИНН 771630193789
          </div>
        </div>
      </footer>
    </div>
  );
}
