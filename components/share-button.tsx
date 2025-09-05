'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getReferralCode, updateChatVisibility } from '@/app/(chat)/actions';
import { ShareModal } from './share-modal';
import { cn } from '@/lib/utils';

export function ShareButton({ chatId }: { chatId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

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

    setIsLoading(true);
    try {
      // First, persist visibility to DB
      const updated = await updateChatVisibility({
        chatId,
        visibility: 'public',
      });
      if (!updated || !Array.isArray(updated) || updated.length === 0) {
        throw new Error('Chat visibility update returned no rows');
      }

      // Generate share URL
      const url = `${window.location.origin}/chat/${chatId}?ref=${referralCode}`;
      setShareUrl(url);

      // Open modal
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to prepare share:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleShare}
        disabled={!referralCode || isLoading}
        className="transition-colors duration-300 ease-in-out"
      >
        {isLoading ? 'Подготовка...' : 'Поделиться'}
      </Button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareUrl={shareUrl}
      />
    </>
  );
}
