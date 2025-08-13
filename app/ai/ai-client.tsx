'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type NavChild = { label: string; href: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };

type Plan = {
  id: string;
  title: string;
  credits: string;
  price: string;
  priceNote?: string;
  pricePer?: string;
  badges: string[];
  features: string[];
  cta: { label: string; href: string };
  popular?: boolean;
};

type Capability = { title: string; description?: string; example?: string };

type QA = { q: string; a: string };

type Content = {
  header: {
    brand: string;
    nav: NavItem[];
    loginLabel: string;
    loginHref: string;
    tryLabel: string;
    tryHref: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  capabilities: { title: string; items: Capability[] };
  plansBlockTitle?: string;
  plans?: Plan[];
  modelsBlockTitle?: string;
  models?: string[];
  extra?: { note: string; bullets: string[] };
  corporate?: {
    title: string;
    subtitle?: string;
    bullets: string[];
    cta: { label: string; href: string };
  };
  faqBlockTitle: string;
  faq: QA[];
  contact: {
    title: string;
    subtitle?: string;
    fields: { name: string; email: string; phone: string; message: string };
    submitLabel: string;
    consent: string;
  };
  legal: {
    publicOffer: string;
    privacy: string;
    subscription: string;
    ogrnip: string;
    inn: string;
  };
  images: { hero?: string };
};

const content: Content = {
  header: {
    brand: 'Aporto',
    nav: [
      { label: 'О проекте', href: '#about' },
      { label: 'Вопросы', href: '#faq' },
      { label: 'Поддержка', href: '#support' },
      /* {
        label: 'Модели',
        children: [
          { label: 'GPT‑изображения', href: '#models' },
          { label: 'Доступ в API', href: '#models' },
          { label: 'Преобразование аудио в текст', href: '#models' },
          { label: 'OpenAI o1 и o3‑mini', href: '#models' },
          { label: 'OpenAI 4o, 4o‑mini, 3.5', href: '#models' },
          { label: 'Anthropic Claude', href: '#models' },
          { label: 'Google Gemini 2.5 Flash', href: '#models' },
          { label: 'Google Gemini 2.5 Pro', href: '#models' },
          { label: 'DeepSeek R1', href: '#models' },
          { label: 'Qwen‑32B', href: '#models' },
        ],
      },
      {
        label: 'Блог',
        children: [
          { label: 'Блог Aporto', href: '#blog' },
          { label: 'Наш блог в телеграм', href: '#blog' },
        ],
      }, */
    ],
    loginLabel: 'Войти',
    loginHref: '/login',
    tryLabel: 'Регистрация',
    tryHref: '/register',
  },
  hero: {
    eyebrow: 'Sonnet 4.0, Google Gemini, Anthropic, Midjourney и DALL·E 3',
    title: 'Бесплатный доступ к нейросетям. Только по приглашениям.',
    subtitle: 'GPT‑5 • GPT‑4 • Claude • Gemini • Qwen • DALL·E 3 • Midjourney',
    description:
      'Mari AI — закрытая клубная платформа. Внутри — лучшие модели (GPT‑5, Gemini 2.5, Claude и др.). Вступление по инвайту.',
    primaryCta: { label: 'Зарегистрироваться', href: '/register' },
    secondaryCta: { label: 'У меня есть код', href: '/register' },
  },
  capabilities: {
    title: 'Что умеет Чат GPT 5?',
    items: [
      {
        title:
          'Делать саммари по книгам или статьям, составлять планы обучения',
        example: 'Пример',
      },
      {
        title: 'Писать промпты для других генеративных сетей',
      },
      {
        title: 'Решать проблему «белого листа», предлагая множество вариантов',
      },
      { title: 'Составлять описание вакансий и должностных инструкций' },
      {
        title:
          'Придумывать заголовки и тексты объявлений для Таргета и контекстной рекламы',
      },
      {
        title:
          'Создавать скрипты для автоматических ответов бота в социальных сетях или Телеграме',
      },
      {
        title:
          'Переводить тексты на разные языки, а также исправлять ошибки в правописании',
      },
      {
        title:
          'Переписывать тексты в художественном, научном или любом другом стиле',
      },
      {
        title:
          'Помогать в написании курсовых и рефератов, решении математических задач',
      },
      { title: 'Писать тексты для сайта, блога или социальных сетей' },
      { title: 'Составлять описание товаров для маркетплейсов' },
      { title: 'Написание промта для других нейросетей через Чат GPT' },
    ],
  },
  /* plansBlockTitle: 'Выберите ваш уровень доступа к ИИ',
  plans: [
    {
      id: 'basic',
      title: 'Базовый',
      credits: '',
      price: 'Бесплатно',
      priceNote: '',
      pricePer: '',
      badges: [],
      features: [
        'Чат с нейросетью',
        'Цифровое видение',
        'GPT-4 mini, Gemini 2 Flash',
      ],
      cta: { label: 'Попробовать сейчас', href: '/register' },
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
        'Чат с нейросетью',
        'Цифровое видение',
        'GPT 5, Claude, Grok, Gemini и др.',
        '1000 токенов ежемесячно',
        'Приоритетная поддержка',
        'Запросы на новые функции',
        'Бесплатные консультации',
        'Отсутствие рекламы',
      ],
      cta: { label: 'Оформить подписку', href: '/register' },
      popular: true,
    },
  ],
  modelsBlockTitle: 'Модели',
  models: [
    'GPT‑изображения',
    'Доступ в API',
    'Преобразование аудио в текст',
    'OpenAI o1 и o3‑мини',
    'OpenAI 4o, 4o‑mini, 3.5',
    'Anthropic Claude',
    'Google Gemini 2.5 Flash',
    'Google Gemini 2.5 Pro',
    'DeepSeek R1',
    'Qwen‑32B',
  ],
  extra: {
    note: 'Одна платформа — десятки нейросетей',
    bullets: [
      'Пишет тексты, код и оптимизирует существующий',
      'Саммари по книгам и статьям',
      'Идеи для рекламы, заголовки, промпты',
      'Переводы и корректура',
      'Скрипты для чат‑ботов',
      'Описание товаров для маркетплейсов',
    ],
  }, */
  /*  corporate: {
    title: 'Корпоративный тариф',
    subtitle:
      'Доступ к топ‑моделям, единый биллинг, управление пользователями, SLA и поддержка.',
    bullets: [
      'Единый счёт и документы для юрлиц',
      'Персональные лимиты доступа и роли',
      'Приоритетные квоты и высокая скорость',
      'Корпоративная поддержка и SLA',
      'Доступ к OpenAI, Anthropic, Google, Midjourney',
      'SAML/SSO по запросу',
    ],
    cta: { label: 'Оставить заявку', href: '#support' },
  }, */
  faqBlockTitle: 'Вопросы',
  faq: [
    {
      q: 'Что такое Aporto?',
      a: 'Aporto — это закрытая платформа с десятками нейросетей в одном месте: от ChatGPT и Midjourney-аналога до инструментов для анализа данных, генерации видео и аудио. Всё в одном аккаунте, без лишних подписок.',
    },
    {
      q: 'Почему платформа закрытая?',
      a: 'Мы ограничиваем количество участников, чтобы сохранить высокое качество работы и стабильность сервиса. Доступ возможен только по личному приглашению (инвайту).',
    },
    {
      q: 'Что такое “инвайт”?',
      a: 'Инвайт — это уникальное приглашение, которое даёт право зарегистрироваться в Aporto. У каждого пользователя есть ограниченное количество инвайтов для друзей.',
    },
    {
      q: 'Как получить инвайт?',
      a: 'У знакомого, который уже в клубе, у блогеров/амбассадоров Aporto.',
    },
    {
      q: 'Поддерживаются ли reasoning‑модели (o‑series, DeepSeek R1, Qwen‑32B)?',
      a: 'Да, доступны o‑series, DeepSeek R1, Qwen‑32B и другие современные модели рассуждений.',
    },
    {
      q: 'Нужен ли VPN?',
      a: 'Нет, доступ без VPN и иностранного номера.',
    },
    {
      q: 'Что такое OpenAI o4‑mini? Доступна ли модель?',
      a: 'Да, доступна бесплатно. Это специализированная LLM для рассуждений (STEM, логика) с высокой скоростью и низкой задержкой.',
    },
    {
      q: 'В чём преимущества Claude 4.0 Sonnet для кодинга?',
      a: 'Глубокое понимание контекста, высокая продуктивность, расширенный вывод, исправление ошибок и сложный анализ данных.',
    },
    {
      q: 'Что за модель QwQ‑32B и кому подойдёт?',
      a: 'Открытая reasoning‑модель от Alibaba (32B), сильна в математике и программировании; конкурирует с более крупными моделями.',
    },
    {
      q: 'Есть ли тестовый период?',
      a: 'Многие модели доступны бесплатно.',
    },
    {
      q: 'Как работают кредиты и списания?',
      a: 'Кредиты списываются за токены/действия по тарифу. Чем старше тариф — тем выгоднее действия.',
    },
    {
      q: 'Можно ли работать с файлами и аудио?',
      a: 'Да, поддерживаются большие файлы и транскрипция аудио (в средних и старших тарифах).',
    },
    {
      q: 'Доступны ли GPT‑изображения и Midjourney?',
      a: 'Да, доступны генерация изображений, Midjourney и DALL·E 3.',
    },
    {
      q: 'Есть ли поиск по интернету?',
      a: 'Да, доступен на тарифе ПРО.',
    },
    {
      q: 'Как связаться с поддержкой?',
      a: 'Через форму в разделе Поддержка. Также возможны e‑mail и мессенджеры по запросу.',
    },
  ],
  contact: {
    title: 'Остались вопросы? Напишите нам!',
    fields: {
      name: 'Имя',
      email: 'Email',
      phone: 'Номер телефона',
      message: 'Введите текст сообщения',
    },
    submitLabel: 'Отправить',
    consent:
      'Отправляя форму, Вы соглашаетесь на обработку персональных данных.',
  },
  legal: {
    publicOffer: 'Публичная оферта',
    privacy: 'Политика конфиденциальности',
    subscription: 'Соглашение с подпиской',
    ogrnip: 'Ткаченко Игорь Алексеевич',
    inn: 'ИНН 262513548985',
  },
  images: { hero: '/demo/4ch.jpg' },
};

export default function AIAcademyDarkEditable() {
  const nav = useMemo(() => content.header.nav, []);
  const [formSuccess, setFormSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Save referral code from ?ref= to localStorage and a cookie (AI page)
  useEffect(() => {
    try {
      const code =
        searchParams?.get('ref') ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref')
          : null);
      if (code) {
        localStorage.setItem('referralCode', code);
        document.cookie = `referralCode=${encodeURIComponent(code)}; path=/; max-age=2592000; samesite=lax`;
      }
    } catch (_) {
      // noop
    }
  }, [searchParams]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement & {
      elements: any;
    };
    const name = (form.elements.namedItem('contact-name') as HTMLInputElement)
      ?.value;
    const email = (form.elements.namedItem('contact-email') as HTMLInputElement)
      ?.value;
    const phone = (form.elements.namedItem('contact-phone') as HTMLInputElement)
      ?.value;
    const message = (
      form.elements.namedItem('contact-message') as HTMLTextAreaElement
    )?.value;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      setFormSuccess(true);
    } catch (err) {
      alert('Ошибка при отправке. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="#" className="text-white font-semibold">
            {content.header.brand}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href || '#'}
                  className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10 transition-colors inline-flex items-center gap-1"
                >
                  <span>{item.label}</span>
                  {item.children && <span className="text-neutral-400">▾</span>}
                </Link>
                {item.children && (
                  <div className="absolute left-0 mt-1 hidden group-hover:block">
                    <div className="min-w-[240px] rounded-xl border border-white/10 bg-[#0f1016] p-2 shadow-xl">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link
              href={content.header.loginHref}
              className="ml-2 px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10"
            >
              {content.header.loginLabel}
            </Link>
            <Link
              href={content.header.tryHref}
              className="ml-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              {content.header.tryLabel}
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section id="about" className="px-6">
          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 items-center py-12 sm:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 mb-4">
                {content.hero.eyebrow}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                {content.hero.title}
              </h1>
              <p className="text-lg sm:text-xl text-neutral-300 mt-4">
                {content.hero.subtitle}
              </p>
              <p className="text-neutral-400 mt-4">
                {content.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href={content.hero.primaryCta.href}
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 text-base shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity text-center"
                >
                  {content.hero.primaryCta.label}
                </Link>
                <Link
                  href={content.hero.secondaryCta.href}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base text-neutral-200 hover:bg-white/10 transition-colors text-center"
                >
                  {content.hero.secondaryCta.label}
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <video
                className="w-full max-w-[560px] aspect-[16/10] rounded-3xl border border-white/10 object-cover"
                src="/images/demo.mp4"
                poster="/images/demo.png"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="px-6 py-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              {content.capabilities.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.capabilities.items.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="text-white font-semibold">{cap.title}</div>
                  {cap.description && (
                    <div className="text-neutral-300 mt-2">
                      {cap.description}
                    </div>
                  )}
                  {cap.example && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-300">
                      {cap.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Models removed as requested */}

        {/* Plans */}
        {content.plans && content.plans.length > 0 && (
          <section id="pricing" className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                {content.plansBlockTitle ?? 'Тарифы'}
              </h2>
              {/* Plan tabs removed; titles moved into cards */}

              <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto justify-items-center">
                {content.plans.map((p) => (
                  <div
                    key={`plan-${p.id}`}
                    className={`rounded-3xl border p-8 bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-200 hover:scale-[1.02] ${
                      p.popular
                        ? 'border-green-500 shadow-lg shadow-green-500/20'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="text-xl font-semibold text-white mb-2">
                      {p.title}
                    </div>
                    <div className="text-neutral-300 mb-2">{p.credits}</div>
                    <div className="text-3xl font-bold text-white">
                      {p.price}
                    </div>
                    {p.pricePer && (
                      <div className="text-sm text-neutral-400 mt-1">
                        {p.pricePer}
                      </div>
                    )}
                    {/* priceNote перенесен внутрь кнопки */}

                    <div className="mt-6 space-y-2">
                      {p.badges.map((b) => (
                        <div
                          key={`badge-${p.id}-${b}`}
                          className="rounded-xl border border-white/10 bg-[#0f1016]/80 px-3 py-2 text-sm text-neutral-200"
                        >
                          {b}
                        </div>
                      ))}
                    </div>

                    <ul className="mt-6 space-y-2 text-neutral-300">
                      {p.features.map((f) => (
                        <li key={`feat-${p.id}-${f}`} className="flex gap-2">
                          <span className="text-indigo-400">✓</span>
                          <span className="capitalize">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={p.cta.href}
                      className="mt-8 inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                    >
                      <span className="block">{p.cta.label}</span>
                      {p.priceNote && (
                        <span className="block text-[11px] leading-tight text-white/80 mt-1">
                          {p.priceNote}
                        </span>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Corporate */}
        {content.corporate && (
          <section className="px-6 pb-12">
            <div className="max-w-7xl mx-auto rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {content.corporate.title}
                  </h3>
                  {content.corporate.subtitle && (
                    <p className="text-neutral-300 mt-2 max-w-3xl">
                      {content.corporate.subtitle}
                    </p>
                  )}
                </div>
                <Link
                  href={content.corporate.cta.href}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                >
                  {content.corporate.cta.label}
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {content.corporate.bullets.map((b) => (
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
        )}

        {/* Extra removed as requested */}

        {/* FAQ */}
        <section id="faq" className="px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">
              {content.faqBlockTitle}
            </h3>
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0f1016]/60">
              {content.faq.map((f) => (
                <details key={`faq-${f.q}`} className="group">
                  <summary className="flex list-none cursor-pointer select-none items-center justify-between px-5 py-4 text-left text-neutral-200 hover:bg-white/5">
                    <span className="font-medium pr-4">{f.q}</span>
                    <span className="ml-auto text-neutral-400 transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-neutral-300 whitespace-pre-line">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="support" className="px-6 pb-16">
          <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h3 className="text-3xl font-bold text-white mb-2">
              {content.contact.title}
            </h3>
            {content.contact.subtitle && (
              <p className="text-neutral-300 mb-6">
                {content.contact.subtitle}
              </p>
            )}
            {formSuccess ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="inline-flex items-center justify-center size-20 bg-green-500/20 rounded-full mb-6 animate-bounce">
                  <svg
                    className="size-10 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Заявка отправлена!
                </h3>
                <p className="text-neutral-300 mb-8 text-lg">
                  Мы получили вашу заявку и свяжемся с вами в ближайшее время.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSuccess(false)}
                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={handleFormSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-sm text-neutral-300 mb-1"
                    >
                      {content.contact.fields.name}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder={content.contact.fields.name}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-sm text-neutral-300 mb-1"
                    >
                      {content.contact.fields.email}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder={content.contact.fields.email}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm text-neutral-300 mb-1"
                  >
                    {content.contact.fields.phone}
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    placeholder={content.contact.fields.phone}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm text-neutral-300 mb-1"
                  >
                    {content.contact.fields.message}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder={content.contact.fields.message}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1016]/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="text-xs text-neutral-400">
                  {content.contact.consent}
                </div>
                <div>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-5 py-3 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                  >
                    {content.contact.submitLabel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-neutral-400 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div>
              <Link
                href={content.header.tryHref}
                className="text-neutral-200 hover:text-white"
              >
                {content.header.tryLabel}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/tos" className="hover:text-white">
                {content.legal.publicOffer}
              </Link>
              <span className="text-neutral-600">•</span>
              <Link href="/privacy" className="hover:text-white">
                {content.legal.privacy}
              </Link>
              <span className="text-neutral-600">•</span>
              <Link href="/tos-subscription" className="hover:text-white">
                {content.legal.subscription}
              </Link>
            </div>
          </div>
          <div className="space-y-1 sm:text-right">
            <div>{content.legal.ogrnip}</div>
            <div>{content.legal.inn}</div>
            <div className="text-neutral-600"> 2025 Aporto</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
