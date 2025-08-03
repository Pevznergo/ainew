'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function InvitePage() {
  const { data: session, status } = useSession();
  const [referralLink, setReferralLink] = useState(
    'https://aporto.tech/api/auth/guest',
  );
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Failed to fetch referral link:', error);
        setReferralLink('https://aporto.tech/api/auth/guest');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
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

  return (
    <div className="font-geist font-sans bg-[#111] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="bg-[#18181b] shadow-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
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
          <div>
            {!session && (
              <Link href="/login" className="modern-btn-cta">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Реферальная ссылка */}
        <section className="mb-12">
          <div className="bg-[#18181b]/80 rounded-2xl shadow-xl p-8 flex flex-col items-center w-full border border-neutral-800 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Ваша реферальная ссылка
            </h2>
            <div className="flex w-full max-w-2xl mb-3">
              <input
                type="text"
                value={loading ? 'Загрузка...' : referralLink || ''}
                readOnly
                className="flex-1 bg-neutral-900 text-white font-mono rounded-l-lg px-5 py-3 outline-none text-base border border-neutral-800"
              />
              <button
                className="modern-btn-outline rounded-l-none rounded-r-lg"
                type="button"
                onClick={copyToClipboard}
                disabled={loading}
              >
                Копировать
              </button>
            </div>
            <p className="text-neutral-400 text-base">
              Поделитесь этой ссылкой с друзьями и получите бонусы!
            </p>
          </div>
        </section>

        {/* Бонусные шаги */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-indigo-700/90 to-green-700/80 rounded-3xl p-10 text-white shadow-xl mb-10 text-center border border-indigo-900">
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
                className="bg-[#18181b] rounded-2xl shadow-lg p-8 flex flex-col items-center border border-neutral-800"
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
        <section className="bg-gradient-to-r from-indigo-700/90 to-green-700/80 rounded-3xl p-10 text-white shadow-xl mb-16 text-center border border-indigo-900">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-8">
            Воспользуйтесь реферальной программой уже сегодня. Вы участвуете?
          </h3>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link href="/" className="modern-btn-cta">
              Начать приглашать
            </Link>
            <Link href="/login" className="modern-btn-outline">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </section>

        {/* Условия и положения */}
        <section className="bg-[#18181b] rounded-3xl shadow-xl p-10 mb-8 border border-neutral-800">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            Условия и положения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
                Бонус за привлечение
              </h3>
              <p className="text-neutral-300 text-base">
                Бонус 1000 токенов (равный 200 рублям) начисляется после того,
                как привлечённый пользователь оплатил подписку на любой тариф.
              </p>
            </div>
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
                Условия вывода
              </h3>
              <p className="text-neutral-300 text-base">
                Вывод средств доступен при накоплении не менее 10 000 токенов.
                Для вывода необходимо написать на почту{' '}
                <a
                  href="mailto:hey@aporto.tech"
                  className="underline text-indigo-400"
                >
                  hey@aporto.tech
                </a>{' '}
                с указанием суммы и реквизитов.
              </p>
            </div>
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
                Реферальная ссылка
              </h3>
              <p className="text-neutral-300 text-base">
                Каждый зарегистрированный пользователь получает уникальную
                реферальную ссылку, которую можно делиться с друзьями и
                знакомыми.
              </p>
            </div>
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
                Правила начисления
              </h3>
              <p className="text-neutral-300 text-base">
                Бонус начисляется только за реальных пользователей, которые
                прошли полную регистрацию и совершили оплату подписки.
              </p>
            </div>
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
                Срок действия
              </h3>
              <p className="text-neutral-300 text-base">
                Реферальная программа действует бессрочно. Бонусы не имеют срока
                действия и накапливаются на вашем балансе.
              </p>
            </div>
            <div className="bg-[#232946] rounded-xl p-6 shadow border border-neutral-800">
              <h3 className="font-semibold text-indigo-400 mb-3">
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
