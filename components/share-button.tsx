'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getReferralCode, updateChatVisibility } from '@/app/(chat)/actions';
import { cn } from '@/lib/utils';

export function ShareButton({ chatId }: { chatId: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReferralCode() {
      try {
        const code = await getReferralCode();
        setReferralCode(code);
      } catch (error) {
        console.error('Failed to fetch referral code:', error);
      }
    }
    fetchReferralCode();
  }, []);

  const handleShare = async () => {
    if (!referralCode) {
      console.error('Referral code not available');
      return;
    }
    const shareUrl = `${window.location.origin}/chat/${chatId}?ref=${referralCode}`;
    try {
      // 1) First, persist visibility to DB
      const updated = await updateChatVisibility({ chatId, visibility: 'public' });
      if (!updated || !Array.isArray(updated) || updated.length === 0) {
        throw new Error('Chat visibility update returned no rows');
      }
      // 2) Then copy the link
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text or update visibility: ', err);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      disabled={!referralCode}
      className={cn(
        'transition-colors duration-300 ease-in-out',
        {
          'bg-green-500 text-white hover:bg-green-600': isCopied,
        }
      )}
    >
      {isCopied ? 'Скопировано' : 'Поделиться'}
    </Button>
  );
}
