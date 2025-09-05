'use client';

import { useState } from 'react';
import { Copy, X, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  title = 'Поделиться чатом',
}: ShareModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('Ссылка скопирована в буфер обмена');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleSocialShare = (platform: string) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(
      'Посмотрите этот интересный чат с ИИ',
    );

    switch (platform) {
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const socialPlatforms = [
    {
      name: 'Telegram',
      key: 'telegram',
      icon: '📱',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'WhatsApp',
      key: 'whatsapp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'Facebook',
      key: 'facebook',
      icon: '👥',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Reddit',
      key: 'reddit',
      icon: '🔗',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      name: 'Twitter',
      key: 'twitter',
      icon: '🐦',
      color: 'bg-sky-500 hover:bg-sky-600',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Ссылка</div>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                aria-label="URL для шейринга"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className={`transition-colors ${
                  isCopied ? 'bg-green-100 border-green-300 text-green-700' : ''
                }`}
              >
                {isCopied ? '✓' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Social Platforms */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Поделиться в социальных сетях
            </div>
            <div className="grid grid-cols-2 gap-2">
              {socialPlatforms.map((platform) => (
                <Button
                  key={platform.key}
                  onClick={() => handleSocialShare(platform.key)}
                  variant="outline"
                  className={`justify-start gap-2 text-white ${platform.color} border-transparent`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
