'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function MainPageClient() {
  // Typewriter
  const [typeIndex, setTypeIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  const searchParams = useSearchParams();
  const demoData = useDemo();

  // Typewriter с данными из БД
  const typewriterTexts =
    demoData?.typewriterText1 && demoData?.typewriterText2
      ? [
          demoData.typewriterText1,
          demoData.typewriterText2,
          demoData.typewriterText3 || 'Напиши код на Python',
          demoData.typewriterText4 || 'Создай презентацию',
        ]
      : defaultTypewriterTexts;

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

  useEffect(() => {
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
  }, [charIndex, isDeleting, typeIndex]);

  // Features Tabs
  const [tab, setTab] = useState(0);

  // Promo banner
  const [showPromo, setShowPromo] = useState(true);

  useEffect(() => {
    const referralCode = searchParams.get('ref');

    if (referralCode) {
      console.log('Saving referral code:', referralCode);
      localStorage.setItem('referralCode', referralCode);
    }
  }, [searchParams]);

  return (
    <div className="font-geist font-sans bg-[#111] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="bg-[#18181b] shadow-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={demoData?.logo_url || '/demo/minaev.png'}
                alt={demoData?.logo_name || 'Сергей Минаев'}
                width={48}
                height={48}
                className="rounded-full object-cover"
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
              className="modern-btn-cta"
              onClick={() => {
                sendGTMEvent('click_open_chat', {
                  event_category: 'engagement',
                  event_label: 'header_cta',
                  location: 'header',
                });
              }}
            >
              Попробовать бесплатно
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent" />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 mb-2 leading-tight drop-shadow-lg">
              {demoData?.hero_title || 'Мой ИИ-помощник'}
            </h1>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white whitespace-nowrap">
                  {displayed}
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
                className="modern-btn-cta text-lg px-8 py-4 rounded-2xl shadow-lg"
                onClick={() => {
                  sendGTMEvent('click_open_chat', {
                    event_category: 'engagement',
                    event_label: 'hero_cta',
                    location: 'hero_section',
                  });
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
              {demoData?.models_title || 'Доступные модели'}
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              {demoData?.models_subtitle ||
                'Используйте лучшие ИИ-модели для изучения истории. От простых вопросов до глубокого анализа.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {models.map((model, index) => (
              <div
                key={model}
                className="bg-[#18181b]/80 rounded-2xl p-4 border border-neutral-800 text-center hover:border-indigo-500/50 transition-colors"
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
              {demoData?.features_title || 'Что умеет мой ИИ'}
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              {demoData?.features_subtitle ||
                'Универсальный помощник для изучения истории и решения любых задач'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {featuresData.map((f, i) => (
              <button
                key={f.title}
                className={`modern-btn-tab ${
                  tab === i ? 'modern-btn-tab-active' : ''
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
                className="rounded-3xl max-w-full shadow-2xl border border-neutral-800"
                style={{ maxHeight: 400, background: '#222' }}
              />
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="min-h-screen flex flex-col justify-center py-20">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Получи максимум с PRO-подпиской
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              Подпишись на ПРО и получай 1000 токенов в месяц всего за 199
              рублей
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-12 justify-center max-w-6xl mx-auto px-4">
            {/* Базовый */}
            <div className="bg-[#18181b]/80 rounded-3xl shadow-xl p-10 flex-1 max-w-md border border-neutral-800 flex flex-col justify-between backdrop-blur-md">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-xl text-white">Базовый</span>
                  <span className="font-semibold text-indigo-400 text-lg">
                    Бесплатно
                  </span>
                </div>
                <ul className="mb-8 space-y-3 text-neutral-200">
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Чат с нейросетью
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Цифровое видение
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    GPT-4 mini, Gemini 2 Flash
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    1000 токенов ежемесячно
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Приоритетная поддержка
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Запросы на новые функции
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Бесплатные консультации
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-indigo-500 to-green-400 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </span>
                    Отсутствие рекламы
                  </li>
                </ul>
              </div>
              <Link
                href="/"
                className="modern-btn-outline mt-4 text-center py-4"
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
            {/* PRO */}
            <div className="relative bg-gradient-to-br from-indigo-700/90 via-indigo-900/90 to-green-900/80 rounded-3xl shadow-2xl p-12 flex-1 max-w-md text-white border-2 border-indigo-500 flex flex-col justify-between ring-4 ring-indigo-500/30 backdrop-blur-md scale-105 z-10">
              {/* Бейдж "Популярно" */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-400 to-indigo-500 text-black font-bold px-6 py-2 rounded-full text-sm shadow-lg border border-white/10">
                  Рекомендую
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-xl">ПРО-аккаунт</span>
                  <span className="font-semibold text-lg">199₽ в месяц</span>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Чат с нейросетью
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Цифровое видение
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    ChatGPT, Claude, DeepSeek, Grok, Gemini и др.
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    1000 токенов ежемесячно
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Приоритетная поддержка
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Запросы на новые функции
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Бесплатные консультации
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-base">
                    <span className="size-6 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center text-black text-sm">
                      ★
                    </span>
                    Отсутствие рекламы
                  </li>
                </ul>
              </div>
              <Link
                href="/login"
                className="modern-btn-cta-alt mt-4 text-center py-4"
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
        </section>
      </main>
      <footer className="mt-8 pb-4">
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
        <div className="text-center text-neutral-500 text-sm">
          {' '}
          {demoData?.footer_text || demoData?.logo_name || 'Сергей Минаев'}
        </div>
      </footer>
    </div>
  );
}
