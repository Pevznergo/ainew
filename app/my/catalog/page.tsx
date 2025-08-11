'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface PageData {
  name: string;
  title: string;
  description: string;
  logo_url?: string;
  background_color?: string;
}

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'Все' },
    { id: 'news', name: 'Новости' },
    { id: 'tech', name: 'Технологии' },
    { id: 'politics', name: 'Политика' },
    { id: 'bloggers', name: 'Блогеры' },
  ];

  // Загружаем данные из БД
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('/api/catalog/pages');
        const data = await response.json();
        console.log('Fetched pages data:', data);
        setPages(data);
      } catch (error) {
        console.error('Error fetching pages:', error);
        // Fallback к статичным данным если API недоступен
        setPages([
          {
            name: 'bottak',
            title: 'Боттак',
            description: 'Политический блогер',
          },
          {
            name: 'breakfast',
            title: 'Breakfast',
            description: 'Утренние новости',
          },
          {
            name: 'minaev',
            title: 'Сергей Минаев',
            description: 'Писатель и блогер',
          },
          {
            name: 'varlamov',
            title: 'Илья Варламов',
            description: 'Блогер и журналист',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const getCategory = (name: string) => {
    if (
      [
        'techmedia',
        'techno_media',
        'technomotel',
        'media1337',
        'exploitex',
      ].includes(name)
    )
      return 'tech';
    if (
      ['bottak', 'khodorkovsky', 'populpolit', 'topor', 'shvets'].includes(name)
    )
      return 'politics';
    if (
      ['minaev', 'gordon', 'sharij', 'sobchak', 'varlamov', 'graham'].includes(
        name,
      )
    )
      return 'bloggers';
    return 'news';
  };

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || getCategory(page.name) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
        <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-neutral-200 hover:text-white transition-colors"
            >
              ← Назад к чату
            </Link>
            <h1 className="text-xl font-semibold text-white">
              Каталог страниц
            </h1>
            <div className="w-32" />
          </div>
        </header>

        <main className="px-6">
          <div className="max-w-6xl mx-auto py-12">
            <div className="text-center mb-12">
              <div className="w-96 h-12 bg-white/[0.04] rounded-2xl animate-pulse mx-auto mb-8" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${Date.now()}-${i}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 animate-pulse"
                >
                  <div className="size-12 bg-white/10 rounded-xl mb-4" />
                  <div className="w-32 h-6 bg-white/10 rounded mb-2" />
                  <div className="w-full h-4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-geist font-sans min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-neutral-200 hover:text-white transition-colors"
          >
            ← Назад к чату
          </Link>
          <h1 className="text-xl font-semibold text-white">Каталог страниц</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="px-6">
        <div className="max-w-6xl mx-auto py-12">
          {/* Hero */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 mb-4">
              Каталог ИИ-страниц
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              Выберите источник новостей
            </h1>
            <p className="text-lg text-neutral-300">
              Персонализированные новости от ваших любимых источников
            </p>
          </section>

          {/* Поиск и фильтры */}
          <section className="mb-12">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по названию или описанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white'
                          : 'bg-white/[0.04] text-neutral-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Сетка страниц */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPages.map((page) => (
                <Link
                  key={page.name}
                  href={`/my/${page.name}`}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {page.logo_url ? (
                      <div className="relative">
                        <Image
                          src={page.logo_url}
                          alt={page.title}
                          width={48}
                          height={48}
                          className="rounded-xl object-cover"
                          onError={(e) => {
                            // Если изображение не загрузилось, скрываем его
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="size-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {page.title.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                        {page.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          getCategory(page.name) === 'tech'
                            ? 'bg-blue-500/20 text-blue-400'
                            : getCategory(page.name) === 'politics'
                              ? 'bg-red-500/20 text-red-400'
                              : getCategory(page.name) === 'bloggers'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {
                          categories.find(
                            (c) => c.id === getCategory(page.name),
                          )?.name
                        }
                      </span>
                    </div>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                    {page.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400 text-sm font-medium">
                      Перейти →
                    </span>
                    <div className="size-6 bg-white/10 rounded-full group-hover:bg-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Статистика */}
          <section className="text-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Статистика</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl font-bold text-indigo-400">
                    {pages.length}
                  </div>
                  <div className="text-neutral-400">Всего страниц</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">
                    {pages.filter((p) => getCategory(p.name) === 'tech').length}
                  </div>
                  <div className="text-neutral-400">Технологии</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400">
                    {
                      pages.filter((p) => getCategory(p.name) === 'politics')
                        .length
                    }
                  </div>
                  <div className="text-neutral-400">Политика</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">
                    {
                      pages.filter((p) => getCategory(p.name) === 'bloggers')
                        .length
                    }
                  </div>
                  <div className="text-neutral-400">Блогеры</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
