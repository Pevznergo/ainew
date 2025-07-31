'use client';

import Link from 'next/link';

export default function TosPage() {
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
          <h1 className="text-3xl font-bold mb-8 text-white text-center">Пользовательское соглашение</h1>

          {/* 1. Общие положения */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">1. Общие положения</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Администрация сайта (далее — «Администрация») предлагает пользователю сети Интернет (далее — Пользователь) использовать сайт Aporto.tech и его сервисы (далее — «Сайт») на условиях, изложенных в настоящем Пользовательском соглашении (далее — «Соглашение», «ПС»). Соглашение вступает в силу с момента выражения Пользователем согласия с его условиями.
              </li>
              <li>
                Использование Сайта регулируется настоящим Соглашением и{' '}
                <Link href="/privacy" className="text-indigo-400 underline">Политикой конфиденциальности</Link>. Соглашение может быть изменено Администрацией без специального уведомления, новая редакция вступает в силу с момента размещения.
              </li>
              <li>
                Начиная использовать Сайт, Пользователь считается принявшим условия Соглашения в полном объеме. В случае несогласия с условиями — не используйте Сайт.
              </li>
            </ol>
          </section>

          {/* 2. Учетная запись Пользователя */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">2. Учетная запись Пользователя. Согласие на обработку персональных данных</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Для получения права использования дополнительной функциональности Сайта Посетителю необходимо пройти Авторизацию.
              </li>
              <li>
                Авторизация осуществляется:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>
                    с помощью социальных сетей (OAuth), передаётся только общедоступная информация (email, имя, фото и др.).
                  </li>
                  <li>
                    с помощью формы регистрации (email, пароль, имя, фамилия).
                  </li>
                </ul>
              </li>
              <li>
                Обработка персональных данных осуществляется в соответствии с законодательством РФ и включает:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>доступ к подписке Aporto PRO;</li>
                  <li>отправку информационных сообщений;</li>
                  <li>анализ данных для улучшения сервиса.</li>
                </ul>
                Данные защищаются и могут быть раскрыты только по закону.
              </li>
              <li>
                Посетитель может удалить аккаунт, написав на <a href="mailto:hey@aporto.tech" className="text-indigo-400 underline">hey@aporto.tech</a>.
              </li>
            </ol>
          </section>

          {/* 3. Использование материалов сайта */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">3. Использование материалов сайта</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Все объекты на Сайте (дизайн, текст, графика и др.) являются объектами исключительных прав Администрации, Пользователей и иных правообладателей.
              </li>
              <li>
                Использование контента возможно только в рамках функционала Сайта. Копирование, распространение и иное использование без разрешения запрещено.
              </li>
            </ol>
          </section>

          {/* 4. Ограничение ответственности */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">4. Ограничение ответственности</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Пользователь использует Сайт на свой риск. Сайт предоставляется «как есть». Администрация не гарантирует соответствие ожиданиям, бесперебойную работу и результаты использования.
              </li>
              <li>
                Администрация не несет ответственности за убытки, возникшие вследствие использования или невозможности использования Сайта.
              </li>
              <li>
                Ответственность Администрации ограничена 1000 рублей РФ и возлагается только при наличии вины.
              </li>
            </ol>
          </section>

          {/* 5. Реклама на сайте */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">5. Реклама на сайте</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Администрация не несет ответственности за содержание рекламных объявлений, размещённых на сайте.
              </li>
            </ol>
          </section>

          {/* 6. Иные положения */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">6. Иные положения</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Настоящее Соглашение представляет собой договор между Пользователем и Администрацией относительно порядка использования Сайта.
              </li>
              <li>
                Соглашение регулируется законодательством РФ. Все споры разрешаются в соответствии с законодательством РФ.
              </li>
              <li>
                Недействительность одного из положений не влияет на остальные.
              </li>
              <li>
                Бездействие Администрации не лишает её права предпринять действия в защиту своих интересов позднее.
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