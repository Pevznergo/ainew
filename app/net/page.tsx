'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ContactForm {
  name: string;
  phone: string;
  blogUrl: string;
}

export default function NetPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    phone: '',
    blogUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const benefits = [
    {
      title: 'Авторский Подход',
      description:
        'Продукт интегрируется в ваш контент естественно, без навязчивой рекламы.',
      icon: '🎯',
    },
    {
      title: 'Полная Поддержка',
      description:
        'Мы берем на себя всё — от упаковки продукта до технической поддержки.',
      icon: '🛠️',
    },
    {
      title: 'Без Рисков',
      description:
        'Если размещение не привело к продажам, вы ничего не теряете.',
      icon: '🛡️',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Получите Готовый Продукт',
      description: 'Выбирайте из наших разработок, например, ИИ-помощник.',
    },
    {
      step: '02',
      title: 'Брендируйте Под Себя',
      description:
        'Мы размещаем продукт на вашем домене, оформляя его как ваш собственный сервис.',
    },
    {
      step: '03',
      title: 'Заполняйте Нераспроданные Слоты',
      description:
        'Когда у вас появляется нераспроданный рекламный слот, размещайте наш продукт и получайте до 70% от прибыли с каждой продажи.',
    },
  ];

  const faqs = [
    {
      question: 'Нужны ли мне вложения?',
      answer:
        'Нет, сотрудничество абсолютно бесплатно. Вы начинаете зарабатывать без первоначальных затрат.',
    },
    {
      question: 'Как быстро я смогу увидеть результаты?',
      answer:
        'Многие наши партнёры начинают получать прибыль уже после первого размещения.',
    },
    {
      question: 'Подходит ли это для всех типов контента?',
      answer:
        'Да, наша модель гибкая и подходит для блогеров, YouTube-каналов, Instagram и других платформ.',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setFormData({ name: '', phone: '', blogUrl: '' });
        setTimeout(() => {
          setShowContactForm(false);
          setSubmitMessage('');
        }, 3000);
      } else {
        setSubmitMessage('Ошибка при отправке заявки. Попробуйте еще раз.');
      }
    } catch (error) {
      setSubmitMessage('Ошибка при отправке заявки. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openContactForm = () => {
    setShowContactForm(true);
    setSubmitMessage('');
  };

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10 transition-colors inline-flex items-center"
            >
              ← Назад к чату
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Aporto</h1>
          </div>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 mb-6 leading-tight drop-shadow-lg">
              Монетизируйте Нераспроданные Рекламные Слоты
            </h1>
            <p className="text-xl sm:text-2xl text-neutral-300 mb-8 leading-relaxed">
              Легко и Без Риска!
            </p>
            <p className="text-lg text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Превратите незаполненные рекламные места в стабильный пассивный
              доход с готовых digital-продуктов, оформленными под вашим именем.
            </p>
            <button
              type="button"
              onClick={openContactForm}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 text-lg shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              Начать Сейчас
            </button>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Что Мы Предлагаем
            </h2>
            <p className="text-lg text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              Мы помогаем контент-мейкерам монетизировать нераспроданные
              рекламные слоты путем продвижения своих digital-продуктов. Всё это
              без вложений, технических сложностей и риска потери доверия вашей
              аудитории.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Как Это Работает
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={`step-${step.step}`}
                className="rounded-2xl p-8 border border-white/10 bg-white/[0.04] hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-indigo-400 mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Почему Это Выгодно
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={`benefit-${benefit.title}`}
                className="rounded-2xl p-8 border border-white/10 bg-white/[0.04] hover:border-indigo-500/50 transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Advantages */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl p-8 border border-indigo-500/30">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Преимущества Сотрудничества
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-400 mb-2">
                  70%
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Высокий Доход
                </h3>
                <p className="text-neutral-300">
                  Возможность получать до 70% от прибыли от каждой продажи.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">0</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Минимум Усилий
                </h3>
                <p className="text-neutral-300">
                  Мы обеспечиваем весь процесс, позволяя вам сосредоточиться на
                  создании контента.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  100%
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Сохранение Доверия
                </h3>
                <p className="text-neutral-300">
                  Продукты выглядят как ваши собственные разработки, укрепляя
                  доверие вашей аудитории.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-20 text-center">
          <div className="bg-gradient-to-br from-indigo-700/90 to-purple-700/80 rounded-3xl p-12 border border-indigo-500/30">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Сделайте Нераспроданные Рекламные Слоты Источником Пассивного
              Дохода!
            </h2>
            <p className="text-lg text-neutral-200 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к нам и начните зарабатывать на тех рекламных
              местах, которые раньше оставались неиспользованными.
            </p>
            <button
              type="button"
              onClick={openContactForm}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 text-lg shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              Начать Сейчас
            </button>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Каталог страниц ИИ-помощников
            </h2>
            <p className="text-lg text-neutral-300 max-w-4xl mx-auto leading-relaxed mb-8">
              Посмотрите, как могут выглядеть ваши собственные ИИ-продукты —
              оформленные под стиль блога и готовые к продвижению.
            </p>
            <p className="text-neutral-400 max-w-3xl mx-auto">
              Каждая страница в каталоге — это демонстрация, как может быть
              реализован продукт от вашего имени, с уникальным оформлением,
              доменом и потенциальной монетизацией.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/my/catalog"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg text-neutral-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              🔗 Открыть каталог
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Часто Задаваемые Вопросы
            </h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={`faq-${faq.question}`}
                className="rounded-2xl p-8 border border-white/10 bg-white/[0.04]"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  {faq.question}
                </h3>
                <p className="text-neutral-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-green-600/20 to-indigo-600/20 rounded-3xl p-12 border border-green-500/30">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Готовы Начать?
            </h2>
            <p className="text-lg text-neutral-200 mb-8 max-w-2xl mx-auto">
              Не упустите возможность превратить нераспроданные рекламные слоты
              в источник пассивного дохода!
            </p>
            <button
              type="button"
              onClick={openContactForm}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 text-lg shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
            >
              Присоединиться Сейчас
            </button>
          </div>
        </section>
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl p-8 max-w-md w-full border border-white/10 bg-white/[0.04] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Оставить заявку</h3>
              <button
                type="button"
                onClick={() => setShowContactForm(false)}
                className="text-neutral-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-300 mb-2"
                >
                  Имя (необязательно)
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-neutral-300 mb-2"
                >
                  Номер телефона *
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label
                  htmlFor="blogUrl"
                  className="block text-sm font-medium text-neutral-300 mb-2"
                >
                  Ссылка на ваш блог/канал *
                </label>
                <input
                  id="blogUrl"
                  type="url"
                  name="blogUrl"
                  value={formData.blogUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="https://t.me/yourchannel"
                />
              </div>

              {submitMessage && (
                <div
                  className={`p-4 rounded-xl ${
                    submitMessage.includes('Ошибка')
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {submitMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-4 shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-8 pb-4">
        <div className="text-center text-neutral-500 text-sm">
          © 2024 Aporto Tech. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
