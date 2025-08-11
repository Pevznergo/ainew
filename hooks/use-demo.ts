'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

type DemoData = {
  name: string;
  logo_name: string;
  logo_url?: string;
  background_color?: string;
  typewriterText1?: string;
  typewriterText2?: string;
  typewriterText3?: string;
  typewriterText4?: string;
  hero_title?: string;
  hero_subtitle?: string;
  features_title?: string;
  features_subtitle?: string;
  features1_title?: string;
  features1_h3?: string;
  features1_p?: string;
  models_title?: string;
  models_subtitle?: string;
  pricing_title?: string;
  pricing_subtitle?: string;
  footer_text?: string;
} | null;

export function useDemo(): { data: DemoData; loading: boolean } {
  const pathname = usePathname();
  const [data, setData] = useState<DemoData>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const pathParts = pathname.split('/');
    const demoName = pathParts[pathParts.length - 1];

    Cookies.set('demo', demoName, { expires: 365 });

    // Попытка загрузить кэш синхронно — если он есть, сразу показываем его (без скелетона)
    const cached = localStorage.getItem(`demo_${demoName}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing cached demo data:', error);
      }
    } else {
      // Нет кэша — показываем скелетон до завершения запроса
      setData(null);
      setLoading(true);
    }

    const fetchDemoData = async () => {
      try {
        const response = await fetch(`/api/demo/${demoName}`, {
          headers: {
            'Cache-Control': 'max-age=3600', // 1 час
          },
        });

        if (response.ok) {
          const json = await response.json();
          setData(json);
          localStorage.setItem(`demo_${demoName}`, JSON.stringify(json));
        } else if (response.status === 404) {
          // Нет данных в БД — разрешаем странице использовать дефолтные значения
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching demo data:', error);
        // В случае ошибки не навязываем дефолты до окончания загрузки — просто завершаем загрузку
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return { data, loading };
}
