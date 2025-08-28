'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export function useTokenBalance() {
  const { data: session, update } = useSession();

  const refreshBalance = useCallback(async () => {
    try {
      await update();
      return true;
    } catch (error) {
      console.error('Failed to refresh token balance:', error);
      return false;
    }
  }, [update]);

  const currentBalance = session?.user?.balance ?? 0;

  return {
    balance: currentBalance,
    refreshBalance,
    isAuthenticated: !!session?.user && session.user.type !== 'guest',
  };
}
