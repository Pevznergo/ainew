'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, VercelIcon, LoaderIcon } from './icons';
import type { Session, User } from 'next-auth';
import { useSidebar } from './ui/sidebar';
import { memo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { toast } from './toast';
import { signOut, useSession } from 'next-auth/react';
import { guestRegex } from '@/lib/constants';

import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { generateUUID } from '@/lib/utils';
import { useModel } from '@/contexts/model-context';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { selectedModel } = useModel();

  const { width: windowWidth } = useWindowSize();
  const { data, status } = useSession();
  const isGuest = guestRegex.test(data?.user?.email ?? '');

  // Показывать только если пользователь авторизован и тип regular
  const showUpgrade =
    session.user &&
    session.user.type === 'regular' &&
    session.user.subscription_active === false;

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 flex-wrap">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {/* Центрированная кнопка "Улучшить до ПРО" */}
      {showUpgrade && (
        <div className="flex-1 flex justify-center order-3 w-full md:w-auto">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded text-sm md:text-base"
            onClick={() => router.push('/profile')}
          >
            Улучшить до ПРО
          </Button>
        </div>
      )}

      {!isReadonly && (
        <ModelSelector
          session={session}
          selectedModelId={selectedModel}
          className="order-1 md:order-2"
        />
      )}

      <div className="ml-auto order-4 md:order-3">
        <div className="w-auto md:w-[250px]">
          {session.user && <SidebarUserNav session={session} />}
        </div>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
