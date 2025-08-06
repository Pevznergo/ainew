import { db } from '@/lib/db';
import { demo } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pages = await db
      .select({
        name: demo.name,
        title: demo.logo_name,
        description: demo.hero_subtitle,
        logo_url: demo.logo_url,
        background_color: demo.background_color,
      })
      .from(demo);

    console.log('Fetched pages from DB:', pages);

    // Обрабатываем logo_url, добавляя полный путь если нужно
    const processedPages = pages.map((page) => ({
      ...page,
      logo_url: page.logo_url?.startsWith('http')
        ? page.logo_url
        : page.logo_url
          ? `/demo/${page.logo_url}`
          : null,
    }));

    return NextResponse.json(processedPages);
  } catch (error) {
    console.error('Error fetching catalog pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 },
    );
  }
}
