'use client';

import { useEffect } from 'react';

export function SetRefCookie() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get('ref');
      if (ref?.trim()) {
        document.cookie = `referralCode=${encodeURIComponent(
          ref.trim(),
        )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      }
    } catch (_) {
      // noop
    }
  }, []);

  return null;
}
