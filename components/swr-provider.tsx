'use client';

import { SWRConfig, useSWRConfig } from 'swr';
import { useEffect } from 'react';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    // Очистить localStorage
    localStorage.clear();

    // Очистить все кэши SWR
    mutate(() => true, undefined, { revalidate: false });
  }, [mutate]);

  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => {
          // Если это не URL, возвращаем null
          if (!url.startsWith('http') && !url.startsWith('/')) {
            return Promise.resolve(null);
          }

          return fetch(url).then((res) => res.json());
        },
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
