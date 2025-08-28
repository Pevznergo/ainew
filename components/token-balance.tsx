'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenBalanceProps {
  className?: string;
  variant?: 'default' | 'compact' | 'mini';
  clickable?: boolean;
}

export function TokenBalance({
  className,
  variant = 'default',
  clickable = true,
}: TokenBalanceProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const handleClick = () => {
    if (clickable) {
      router.push('/profile#balance');
    }
  };

  useEffect(() => {
    if (session?.user?.balance !== undefined) {
      const newBalance = session.user.balance;
      if (newBalance !== balance && balance > 0) {
        setHasChanged(true);
        setTimeout(() => setHasChanged(false), 1500);
      }
      setBalance(newBalance);
    }
  }, [session?.user?.balance, balance]);

  // Refresh session data periodically to catch balance changes
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only update if user is active and has sent messages recently
      const now = Date.now();
      if (now - lastUpdate > 60000) {
        // Update every minute
        try {
          setIsUpdating(true);
          await update();
          setLastUpdate(now);
        } catch (error) {
          console.error('Failed to update session:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [update, lastUpdate]);

  // Manual update trigger when user activity is detected
  useEffect(() => {
    const handleActivity = async () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) {
        // Update if last update was more than 10 seconds ago
        try {
          setIsUpdating(true);
          await update();
          setLastUpdate(now);
        } catch (error) {
          console.error('Failed to update session:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    };

    // Listen for focus events (user returns to tab)
    window.addEventListener('focus', handleActivity);

    return () => {
      window.removeEventListener('focus', handleActivity);
    };
  }, [update, lastUpdate]);

  // Don't show for guest users or when not authenticated
  if (status === 'loading' || !session?.user || session.user.type === 'guest') {
    return null;
  }

  if (variant === 'mini') {
    return (
      <div
        onClick={handleClick}
        role="button"
        tabIndex={clickable ? 0 : -1}
        className={cn(
          'flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-md text-xs transition-all duration-200',
          hasChanged && 'ring-1 ring-amber-400/50',
          isUpdating && 'opacity-70',
          clickable &&
            'cursor-pointer hover:bg-accent hover:border-accent-foreground/20',
          className,
        )}
        title={clickable ? 'Нажмите для пополнения токенов' : undefined}
      >
        <Coins
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform duration-200',
            hasChanged && 'rotate-12 text-amber-500',
          )}
        />
        <span className="text-xs font-medium text-foreground">
          {balance.toLocaleString()}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        role="button"
        tabIndex={clickable ? 0 : -1}
        className={cn(
          'flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 px-2.5 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 transition-all duration-300',
          hasChanged && 'ring-2 ring-amber-400/50 scale-105',
          isUpdating && 'opacity-70',
          clickable &&
            'cursor-pointer hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/40 dark:hover:to-yellow-900/40 hover:border-amber-300/70 dark:hover:border-amber-700/70',
          className,
        )}
        title={clickable ? 'Нажмите для пополнения токенов' : undefined}
      >
        <Coins
          className={cn(
            'h-3.5 w-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-300',
            hasChanged && 'rotate-12',
          )}
        />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {balance.toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={clickable ? 0 : -1}
      className={cn(
        'flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 px-3 py-2 rounded-xl border border-amber-200/50 dark:border-amber-800/50 shadow-sm transition-all duration-300',
        hasChanged && 'ring-2 ring-amber-400/50 scale-105',
        isUpdating && 'opacity-70',
        clickable &&
          'cursor-pointer hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/40 dark:hover:to-yellow-900/40 hover:border-amber-300/70 dark:hover:border-amber-700/70',
        className,
      )}
      title={clickable ? 'Нажмите для пополнения токенов' : undefined}
    >
      <Coins
        className={cn(
          'h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-300',
          hasChanged && 'rotate-12',
        )}
      />
      <div className="flex flex-col">
        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          Токены
        </span>
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          {balance.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
