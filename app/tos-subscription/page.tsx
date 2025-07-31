'use client';

import Link from 'next/link';

export default function TosSubscriptionPage() {
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
          <h1 className="text-3xl font-bold mb-8 text-white text-center">
            Соглашение с подпиской (Оферта в отношении рекуррентных платежей)
          </h1>

          {/* Преамбула */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Преамбула</h2>
            <p className="text-neutral-200">
              Настоящей публичной офертой в отношении рекуррентных платежей (далее — «Оферта») самозанятый Ткаченко Игорь Алексеевич, зарегистрированный в Российской Федерации с номером ИНН 262513548985, являющийся правообладателем Сайта, именуемый в дальнейшем «Исполнитель», с одной стороны, предлагает воспользоваться услугой «Рекуррентный платёж» на условиях настоящей Оферты любому физическому лицу (далее — «Заказчик»), который примет настоящее предложение. Оферта является приложением к <Link href="/tos" className="text-indigo-400 underline">Пользовательскому соглашению</Link>. Совершая действия по активации сервиса «Рекуррентный платёж», Заказчик соглашается с условиями Оферты. Договор считается заключённым без подписания, акцепт оферты приравнивается к заключению договора.
            </p>
          </section>

          {/* Основные понятия */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Основные понятия, используемые в соглашении</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>Исполнитель — Самозанятый Ткаченко Игорь Алексеевич, ИНН 262513548985.</li>
              <li>Заказчик — Лицо, заинтересованное в оказании Исполнителем услуг.</li>
              <li>Договор (оферта) — договор, заключённый посредством акцепта оферты сервиса.</li>
              <li>Рекуррентный платёж — автоматическое списание средств с банковской карты за услуги.</li>
              <li>Сайт — онлайн-ресурс, принадлежащий Исполнителю.</li>
              <li>Сервис — услуги, предоставляемые Сайтом и программой.</li>
              <li>Банковская карта — инструмент безналичных расчетов, используемый для оплаты услуг.</li>
              <li>Банк-эмитент — организация, выпускающая банковские карты.</li>
              <li>Процессинговый центр — система обработки транзакций по банковским картам.</li>
              <li>Держатель карты — физическое лицо, распоряжающееся картой.</li>
            </ol>
          </section>

          {/* Порядок предоставления услуги */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Порядок предоставления услуги «Рекуррентный платёж»</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>Подключение услуги осуществляется Заказчиком через интерфейс Сайта или приложения.</li>
              <li>Списание средств осуществляется автоматически согласно выбранному тарифу и периодичности.</li>
              <li>В случае невозможности продления подписки Исполнитель вправе повторять попытки списания в течение 28 дней, но не более 4 раз.</li>
              <li>Исполнитель может проводить акции, изменяя стоимость подписки.</li>
              <li>Все платежи осуществляются в рублях РФ, без НДС, на условиях 100% предоплаты.</li>
              <li>Платные сервисы предоставляются только после оплаты.</li>
              <li>Платежи не включают стоимость интернет-трафика.</li>
            </ol>
          </section>

          {/* Отключение сервиса */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Отключение сервиса «Рекуррентный платёж»</h2>
            <p className="text-neutral-200">
              Отключение (отказ) от сервиса происходит путем отправки письма на <a href="mailto:hey@aporto.tech" className="text-indigo-400 underline">hey@aporto.tech</a> с email, привязанного к аккаунту. Успешная остановка подтверждается письмом на ваш email. Если подтверждения не было — повторите отказ или обратитесь в поддержку.
            </p>
          </section>

          {/* Ответственность сторон */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Ответственность сторон</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>Исполнитель, процессинговый центр, банк-эмитент не несут ответственности за неработоспособность сервиса. Заказчик обязан использовать иные способы оплаты при сбоях.</li>
              <li>Ответственность Исполнителя ограничивается суммой, зачисленной с использованием сервиса.</li>
              <li>Споры разрешаются в соответствии с условиями Договора и Публичной оферты.</li>
            </ol>
          </section>

          {/* Возврат денежных средств */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Возврат денежных средств</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>Возврат производится, если средства списаны после отключения сервиса или согласно условиям Публичной оферты.</li>
              <li>Возврат осуществляется в течение 14 банковских дней после получения запроса.</li>
            </ol>
          </section>

          {/* Прочие условия */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Прочие условия и положения</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-200">
              <li>
                Подключая сервис, Заказчик:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Соглашается со всеми условиями настоящего Соглашения;</li>
                  <li>Дает акцепт на списание средств Исполнителем с карты;</li>
                  <li>Предоставляет право хранить и обрабатывать персональные данные для реализации Соглашения;</li>
                  <li>Дает согласие на оплату услуг согласно условиям Договора и Публичной оферты.</li>
                </ul>
              </li>
              <li>Исполнитель вправе отключить или ограничить Заказчика от сервиса по соображениям безопасности.</li>
              <li>Права и обязанности по Оферте не могут быть переданы третьим лицам без письменного согласия.</li>
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