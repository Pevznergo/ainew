'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="font-geist font-sans bg-[#111] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="bg-[#18181b] shadow-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-6">
          <Link href="/" className="flex items-center font-bold text-2xl text-white">
            Aporto
          </Link>
          <nav>
            <Link href="/" className="modern-btn-cta">
              Открыть чат
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center py-14 px-2">
        <div className="w-full max-w-5xl bg-[#18181b]/90 rounded-3xl shadow-2xl p-12 border border-neutral-800 backdrop-blur-md">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">Политика конфиденциальности</h1>

          <section className="mb-8">
            <p className="text-neutral-200 mb-4">
              Администрация сайта Aporto.tech (далее – «Сайт») с уважением относится к правам посетителей. Мы признаём важность конфиденциальности личной информации. Эта страница содержит сведения о том, какую информацию мы получаем и собираем, когда вы пользуетесь Сайтом. Настоящая политика распространяется только на Сайт и не применяется к сторонним ресурсам.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Сбор информации</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                При посещении Сайта мы определяем имя домена вашего провайдера и страну, а также фиксируем переходы между страницами (“активность потока переходов”). Сайт не собирает и не хранит личную информацию, если вы не регистрируетесь. Понятие “личная информация” включает данные, которые определяют вас как конкретное лицо (например, имя или email).
              </li>
              <li>
                Сайт использует технологию “cookies” для статистики. Cookies — это небольшие данные, сохраняемые браузером на вашем устройстве. Они могут содержать информацию о настройках просмотра и статистике посещений, но не содержат личных данных.
              </li>
              <li>
                Мы используем стандартные журналы веб-сервера для подсчёта посетителей и оценки технических возможностей Сайта. Эта информация помогает нам улучшать структуру и содержание ресурса. Вы можете отключить cookies в настройках браузера.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Совместное использование информации</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Сайт может сотрудничать с компаниями, размещающими рекламные материалы. Сторонние поставщики (например, Google, Яндекс) используют cookies для показа рекламы с учётом ваших предыдущих посещений. Вы можете отказаться от использования таких файлов в настройках рекламных предпочтений.
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Сторонние поставщики используют cookies для показа объявлений.</li>
                  <li>Cookies DoubleClick позволяют показывать рекламу на других сайтах.</li>
                  <li>Вы можете отказаться от cookies в настройках Google.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Отказ от ответственности</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Передача личной информации при посещении сторонних сайтов, даже если на них есть ссылка с нашего Сайта, не подпадает под действие этой политики. Мы не несем ответственности за действия других сайтов.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Изменение политики конфиденциальности</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Мы можем время от времени обновлять политику конфиденциальности. Рекомендуем периодически проверять эту страницу.
              </li>
            </ol>
          </section>

          <div className="text-center text-neutral-500 mt-10">© 2025</div>
        </div>
      </main>

      <footer className="mt-12 pb-4">
        <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Политика конфиденциальности
          </Link>
          <Link href="/tos" className="text-indigo-400 hover:underline">
            Пользовательское соглашение
          </Link>
          <Link href="/tos-subscription" className="text-indigo-400 hover:underline">
            Соглашение с подпиской
          </Link>
          <a href="mailto:hey@aporto.tech" className="text-indigo-400 hover:underline">
            Связаться с нами
          </a>
        </nav>
        <div className="text-center text-neutral-500 text-sm">© 2025</div>
      </footer>
    </div>
  );
} 