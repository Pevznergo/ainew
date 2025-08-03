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
  } | null>(null);

  useEffect(() => {
    const pathParts = pathname.split('/');
    const demoName = pathParts[pathParts.length - 1];

    Cookies.set('demo', demoName, { expires: 365 });

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
