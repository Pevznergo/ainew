'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWindowSize } from 'usehooks-ts';

interface FeedHeaderProps {
  session: Session | null;
}

function PureFeedHeader({ session }: FeedHeaderProps) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 flex-wrap border-b border-border z-40">
      <SidebarToggle />

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-foreground">Лента</h1>
      </div>

      {(!open || (windowWidth && windowWidth < 768)) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              type="button"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">Новый чат</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Новый чат</TooltipContent>
        </Tooltip>
      )}

      {session?.user && (
        <div className="ml-auto hidden md:block">
          <Button
            variant="outline"
            className="px-3 py-1.5 h-fit"
            type="button"
            onClick={() =>
              router.push(`/u/${session.user.nickname || session.user.id}`)
            }
          >
            Мой канал
          </Button>
        </div>
      )}
    </header>
  );
}

export const FeedHeader = memo(PureFeedHeader);
