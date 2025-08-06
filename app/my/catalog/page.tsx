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
      <div className="font-geist font-sans bg-[#111] min-h-screen flex flex-col text-neutral-100">
        <header className="bg-[#18181b] shadow-sm border-b border-neutral-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
            <div>
              <Link
                href="/"
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium"
              >
                ← Назад к чату
              </Link>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Каталог страниц</h1>
            </div>
            <div className="w-32" />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="w-96 h-12 bg-neutral-700 rounded animate-pulse mx-auto mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${Date.now()}-${i}`}
                  className="bg-[#18181b]/80 rounded-2xl p-6 border border-neutral-800 animate-pulse"
                >
                  <div className="size-12 bg-neutral-700 rounded-xl mb-4" />
                  <div className="w-32 h-6 bg-neutral-700 rounded mb-2" />
                  <div className="w-full h-4 bg-neutral-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              ← Назад к чату
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Каталог страниц</h1>
          </div>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 mb-6 leading-tight drop-shadow-lg">
            Каталог ИИ-страниц
          </h1>
        </section>

        {/* Поиск и фильтры */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-[#18181b] border border-neutral-700 rounded-xl text-white placeholder-neutral-400 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#18181b] text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Сетка страниц */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPages.map((page) => (
              <Link
                key={page.name}
                href={`/my/${page.name}`}
                className="group bg-[#18181b]/80 rounded-2xl p-6 border border-neutral-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105"
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
                    <div className="size-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
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
                        categories.find((c) => c.id === getCategory(page.name))
                          ?.name
                      }
                    </span>
                  </div>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {page.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-indigo-400 text-sm font-medium">
                    Перейти →
                  </span>
                  <div className="size-6 bg-neutral-700 rounded-full group-hover:bg-indigo-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Статистика */}
        <section className="mt-20 text-center">
          <div className="bg-[#18181b]/80 rounded-3xl p-8 border border-neutral-800">
            <h2 className="text-2xl font-bold text-white mb-4">Статистика</h2>
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
      </main>

      <footer className="mt-8 pb-4">
        <div className="text-center text-neutral-500 text-sm">
          © 2024 Aporto Tech. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
