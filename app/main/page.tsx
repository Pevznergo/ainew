'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const typewriterTexts = [
  'Найди информацию',
  'Помоги с SEO',
  'Напиши код на питоне',
  'Напиши письмо',
];

const featuresData = [
  {
    title: 'Распознавание текста',
    h3: 'Распознавание текста с фото и документов',
    p: 'Фото документа или визитки? Hey, Bro! мгновенно преобразует изображение в текст, который можно редактировать и использовать далее',
    video: '/images/case1.mp4',
    poster: '/images/case1.jpg',
  },
  {
    title: 'Математика',
    h3: 'Быстрые расчёты и числовая логика',
    p: 'Hey, Bro! поможет фрилансерам решать расчёты для бюджета, цен, аналитики и технических задач. Поддерживает формулы, таблицы, графики и пошаговые объяснения — не нужно переключаться между калькулятором и Excel.',
    video: '/images/case2.mp4',
    poster: '/images/case2.jpg',
  },
  {
    title: 'Анализ фото',
    h3: 'Анализируй и описывай изображения',
    p: 'Выделите область экрана, и Hey, Bro! подскажет, что в ней изображено. Это удобно для анализа скриншотов и изображений.',
    video: '/images/case3.mp4',
    poster: '/images/case3.jpg',
  },
  {
    title: 'Учёба',
    h3: 'Создание учебных пособий и материалов',
    p: 'Генерируйте учебные материалы на основе задаваемых тем. Hey, Bro! разложит всё по полочкам и сделает материал максимально понятным.',
    video: '/images/case4.mp4',
    poster: '/images/case4.jpg',
  },
  {
    title: 'Домашние дела',
    h3: 'Помощь с домашними делами и планированием',
    p: 'Бро поможет составить список дел, напомнит о важных задачах, подскажет лайфхаки для быта и поможет всё организовать.',
    video: '/images/case5.mp4',
    poster: '/images/case5.jpg',
  },
];

export default function MainPage() {
  // Typewriter
  const [typeIndex, setTypeIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

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
  const [tab, setTab] = useState(3); // "Учёба" по умолчанию

  // Promo banner
  const [showPromo, setShowPromo] = useState(true);

  return (
    <div className="font-geist font-sans bg-[#111] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="bg-[#18181b] shadow-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center font-bold text-2xl text-white"
          >
            Aporto
          </Link>
          <nav>
            <Link
              href="/"
              className="modern-btn-cta"
              onClick={() => {
                // GTM dataLayer событие
                if (typeof window !== 'undefined' && window.dataLayer) {
                  window.dataLayer.push({
                    event: 'click_open_chat',
                    event_category: 'engagement',
                    event_label: 'main_page_cta',
                  });
                }
              }}
            >
              Открыть чат
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="mb-20">
          <div className="flex flex-col items-center justify-center text-center px-4 py-10 md:py-20 space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 mb-2 leading-tight drop-shadow-lg">
              Все лучшие Нейросети
              <br className="hidden md:inline" /> в одном месте
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
                ChatGPT, Claude, DeepSeek, Grok, Gemini и др.
                <br />
                <span className="block mt-2 text-xl sm:text-2xl">
                  <span className="text-indigo-400 font-bold">Бесплатно</span>{' '}
                  навсегда!
                </span>
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/"
                className="modern-btn-cta text-lg px-8 py-4 rounded-2xl shadow-lg"
              >
                Открыть чат
              </Link>
            </div>
          </div>
        </section>

        {/* Promo banner */}
        {showPromo && (
          <Link
            href="/invite"
            className="fixed bottom-6 right-6 z-50 bg-[#18181b] shadow-xl rounded-2xl flex items-center gap-4 px-6 py-4 border border-indigo-900 max-w-xs cursor-pointer transition hover:shadow-2xl hover:border-indigo-500"
            style={{ textDecoration: 'none' }}
            tabIndex={0}
            aria-label="Промо: бонус до 40 000 ₽ при регистрации сегодня"
          >
            <button
              className="absolute top-2 right-2 text-2xl text-neutral-500 hover:text-red-500 z-10"
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
              alt="Подарок"
              width={32}
              height={32}
              style={{ minWidth: 32, minHeight: 32 }}
            />
            <div>
              <div className="font-bold text-base text-white">
                Бонус до 40 000 ₽ при регистрации сегодня
              </div>
              <div className="text-xs mt-1 text-indigo-400 underline">
                Условия акции
              </div>
            </div>
          </Link>
        )}

        {/* Features */}
        <section className="min-h-screen flex flex-col justify-center py-20">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Бро решит любые задачи
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              Нейросеть <b>Hey, Bro!</b> — это умный помощник со встроенными
              ChatGPT, Claude, DeepSeek, Grok, Gemini и другими.
              <br />
              Бро напишет код, решит задачу, поможет с работой и учёбой.
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
              Подпишись на ПРО и получай 1000 брокоинов в месяц всего за 199
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
                  <li className="text-base">1000 брокоинов ежемесячно</li>
                  <li className="text-base">Приоритетная поддержка</li>
                  <li className="text-base">Запросы на новые функции</li>
                  <li className="text-base">Бесплатные консультации</li>
                  <li className="text-base">Отсутствие рекламы</li>
                </ul>
              </div>
              <Link
                href="/web"
                className="modern-btn-outline mt-4 text-center py-4"
                target="_blank"
                rel="noopener"
              >
                Попробовать сейчас
              </Link>
            </div>
            {/* PRO */}
            <div className="relative bg-gradient-to-br from-indigo-700/90 via-indigo-900/90 to-green-900/80 rounded-3xl shadow-2xl p-12 flex-1 max-w-md text-white border-2 border-indigo-500 flex flex-col justify-between ring-4 ring-indigo-500/30 backdrop-blur-md scale-105 z-10">
              {/* Бейдж "Популярно" */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-400 to-indigo-500 text-black font-bold px-6 py-2 rounded-full text-sm shadow-lg border border-white/10">
                  Лучший выбор
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-xl">PRO-аккаунт</span>
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
                    1000 брокоинов ежемесячно
                  </li>
                  <li className="text-base">Приоритетная поддержка</li>
                  <li className="text-base">Запросы на новые функции</li>
                  <li className="text-base">Бесплатные консультации</li>
                  <li className="text-base">Отсутствие рекламы</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="modern-btn-cta-alt mt-4 text-center py-4"
                target="_blank"
                rel="noopener"
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
        <div className="text-center text-neutral-500 text-sm">© 2025</div>
      </footer>
    </div>
  );
}
