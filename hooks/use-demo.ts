'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export function useDemo() {
  const pathname = usePathname();
  const [demoData, setDemoData] = useState<{
    name: string;
    logo_name: string;
    logo_url?: string;
    background_color?: string;
  } | null>(null);

  useEffect(() => {
    // Получаем имя из пути (например, /my/pevzner -> pevzner)
    const pathParts = pathname.split('/');
    const demoName = pathParts[pathParts.length - 1];

    // Устанавливаем cookie
    Cookies.set('demo', demoName, { expires: 365 });

    // Загружаем данные из БД
    const fetchDemoData = async () => {
      try {
        const response = await fetch(`/api/demo/${demoName}`);
        if (response.ok) {
          const data = await response.json();
          setDemoData(data);
        }
      } catch (error) {
        console.error('Error fetching demo data:', error);
      }
    };

    fetchDemoData();
  }, [pathname]);

  return demoData;
}
