'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { sendGTMEvent } from '@/lib/gtm';

const faqData = [
  {
    question: 'Нужно ли программировать?',
    answer: 'Нет, всё настроено.',
  },
  {
    question: 'Кто отвечает за поддержку и оплату?',
    answer: 'Мы.',
  },
  {
    question: 'Можно ли кастомизировать интерфейс?',
    answer: 'Да, в версии PRO.',
  },
  {
    question: 'Какие модели доступны?',
    answer: 'GPT-4, Claude 3, Gemini и др.',
  },
  {
    question: 'Сколько я заработаю?',
    answer: '40% от всей выручки.',
  },
  {
    question: 'За сколько запустишься?',
    answer: '15–30 минут.',
  },
];

const targetAudience = [
  'YouTube-блогерам',
  'Instagram-креаторам',
  'Подкастерам',
  'Телеграм-каналам',
  'Онлайн-экспертам',
  'Актёрам, ведущим и другим публичным личностям',
];

const features = [
  'GPT-4, Claude 3, Gemini, Mistral',
  'Midjourney, DALL·E, ElevenLabs, Runway',
  'Работа с текстами, изображениями, видео',
  'Код, озвучка и презентации',
  'Всё в одной подписке',
];

export default function NetLandingPage() {
  const [activeTab, setActiveTab] = useState(0);

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
                sendGTMEvent('click_open_chat', {
                  event_category: 'engagement',
                  event_label: 'header_cta',
                  location: 'header',
                });
              }}
            >
              Открыть чат
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="mb-20">
          <div className="flex flex-col items-center justify-center text-center px-4 py-10 md:py-20 space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 mb-2 leading-tight drop-shadow-lg">
              Хватит продвигать чужое – создавай своё!
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-neutral-300 mt-2 max-w-4xl leading-relaxed">
              Запусти готовый AI-чат с десятками нейросетей под собственным
              именем. Твой бренд, твой домен, свое приложение в сторах –
              зарабатывай, а мы займемся остальным.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                href="/"
                className="modern-btn-cta text-lg px-8 py-4 rounded-2xl shadow-lg"
                onClick={() => {
                  sendGTMEvent('click_launch_ai_service', {
                    event_category: 'engagement',
                    event_label: 'hero_cta',
                    location: 'hero_section',
                  });
                }}
              >
                �� Запустить AI-сервис
              </Link>
              <Link
                href="/"
                className="modern-btn-outline text-lg px-8 py-4 rounded-2xl"
                onClick={() => {
                  sendGTMEvent('click_watch_demo', {
                    event_category: 'engagement',
                    event_label: 'hero_demo',
                    location: 'hero_section',
                  });
                }}
              >
                Смотреть демо
              </Link>
            </div>
          </div>
        </section>

        {/* Problem & Solution Section */}
        <section className="mb-20 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Проблема и решение
              </h2>
              <div className="bg-red-900/20 border border-red-800 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold text-red-400 mb-3">
                  Проблема:
                </h3>
                <p className="text-neutral-300 text-lg">
                  Когда у блогера большая аудитория, реклама становится дорогой,
                  а найти подходящих рекламодателей – сложно. Ты тратишь деньги
                  и время, а доход зачастую остаётся ниже потенциала.
                </p>
              </div>
              <div className="bg-green-900/20 border border-green-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-green-400 mb-3">
                  Решение:
                </h3>
                <p className="text-neutral-300 text-lg mb-4">
                  Запусти свой AI-чат и продвигай собственные продукты. Создавая
                  свой бренд, ты не только избавляешься от высоких затрат на
                  рекламу, но и получаешь дополнительный стабильный доход.
                </p>
                <ul className="space-y-2 text-neutral-300">
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">★</span>
                    <span>Рекламируешь чужой продукт → Одноразовый платеж</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">★</span>
                    <span>
                      Собственный AI-чат → 40% с каждой подписки, постоянный
                      доход
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">★</span>
                    <span>
                      Ограниченное количество рекламодателей → Свои продукты для
                      своей аудитории
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl p-8 border border-indigo-500/30">
                <Image
                  src="/images/logo.svg"
                  alt="AI Chat Platform"
                  width={300}
                  height={300}
                  className="rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-20 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Как это работает
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto">
              3 простых шага к собственному AI-сервису
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#18181b]/80 rounded-3xl p-8 border border-neutral-800 text-center">
              <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Получи свой AI-чат
              </h3>
              <p className="text-neutral-300">
                Мы подтверждаем твой бренд, подключаем домен и создаём
                уникальное приложение.
              </p>
            </div>
            <div className="bg-[#18181b]/80 rounded-3xl p-8 border border-neutral-800 text-center">
              <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Продвигай среди подписчиков
              </h3>
              <p className="text-neutral-300">
                Размещай ссылку в описании, stories, интеграциях и т.п.
              </p>
            </div>
            <div className="bg-[#18181b]/80 rounded-3xl p-8 border border-neutral-800 text-center">
              <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Зарабатывай</h3>
              <p className="text-neutral-300">
                Ты получаешь 40% от каждой оплаты, а мы решаем все технические
                нюансы.
              </p>
            </div>
          </div>
        </section>

        {/* What's Inside Section */}
        <section className="mb-20 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Что внутри
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto">
              Одна платформа – десятки нейросетей. Забудь о подписках на разные
              сервисы:
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-3xl p-8 border border-indigo-500/30">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">
                  Доступные модели:
                </h3>
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-neutral-300"
                    >
                      <span className="text-indigo-400">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center items-center">
                <div className="bg-[#18181b]/50 rounded-2xl p-6 border border-neutral-700">
                  <p className="text-center text-neutral-300 text-lg">
                    Работа с текстами, изображениями, видео, кодом, озвучкой и
                    презентациями – всё в одной подписке.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="mb-20 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Кому это подходит
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targetAudience.map((audience) => (
              <div
                key={audience}
                className="bg-[#18181b]/80 rounded-2xl p-6 border border-neutral-800 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {targetAudience.indexOf(audience) + 1}
                  </div>
                  <span className="text-white font-semibold">{audience}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why It's Profitable Section */}
        <section className="mb-20 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Почему это выгодно
            </h2>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto">
              Мы берем на себя всю техническую сторону:
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-green-900/20 border border-green-800 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-6">Мы:</h3>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>хостинг</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>техническая поддержка</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>обновления</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>работа с пользовательской базой</span>
                </li>
              </ul>
            </div>
            <div className="bg-indigo-900/20 border border-indigo-800 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-indigo-400 mb-6">Ты:</h3>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-center gap-3">
                  <span className="text-indigo-400">✓</span>
                  <span>делишься ссылкой</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-indigo-400">✓</span>
                  <span>строишь доверие</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-indigo-400">✓</span>
                  <span>получаешь стабильный доход</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Offer Section */}
        <section className="mb-20 py-20">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-3xl p-12 border border-indigo-500/30 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Начни бесплатно за 15 минут!
            </h2>
            <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto">
              Тестируй на поддомене yourname.aporto.tech, а затем переходи на
              PRO – получай собственный домен и приложение в сторах.
            </p>
            <Link
              href="/"
              className="modern-btn-cta text-xl px-12 py-6 rounded-2xl shadow-lg"
              onClick={() => {
                sendGTMEvent('click_get_ai_chat', {
                  event_category: 'engagement',
                  event_label: 'offer_cta',
                  location: 'offer_section',
                });
              }}
            >
              🚀 Получить свой AI‑чат
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Часто задаваемые вопросы
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {faqData.map((faq) => (
              <div
                key={faq.question}
                className="bg-[#18181b]/80 rounded-2xl p-6 border border-neutral-800"
              >
                <h3 className="text-lg font-bold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-neutral-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 pb-4">
        <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
          <a
            href="https://t.me/aporto_tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            Telegram для связи
          </a>
          <Link href="/" className="text-indigo-400 hover:underline">
            Публичное демо
          </Link>
          <Link href="/" className="text-indigo-400 hover:underline">
            Условия партнёрства
          </Link>
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Политика конфиденциальности
          </Link>
          <Link href="/tos" className="text-indigo-400 hover:underline">
            Пользовательское соглашение
          </Link>
        </nav>
        <div className="text-center text-neutral-500 text-sm">© 2025</div>
      </footer>
    </div>
  );
}
