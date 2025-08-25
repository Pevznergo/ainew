'use client';

import { useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import type { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useUser } from '@/contexts/user-context';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';

export function SidebarUserNav({ session }: { session: Session }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { user, setUser } = useUser();

  // Обновлять контекст при изменении data из useSession
  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data?.user, setUser]);

  // Используем данные из session prop для отображения
  const currentUser = session.user || data?.user;

  const isGuest = guestRegex.test(currentUser?.email ?? '');
  const isRegular = currentUser?.type === 'regular';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <Image
                  src={
                    currentUser?.email
                      ? `https://avatar.vercel.sh/${currentUser.email}`
                      : '/images/profile.png'
                  }
                  alt={currentUser?.email ?? 'User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span data-testid="user-email" className="truncate">
                  {isGuest ? 'Войти' : currentUser?.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`${resolvedTheme === 'light' ? 'Темная' : 'Светлая'} тема`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {isRegular && (
              <>
                {/* Новый пункт: Профиль */}
                <DropdownMenuItem
                  data-testid="user-nav-item-profile"
                  className="cursor-pointer"
                  onSelect={() => router.push('/profile')}
                >
                  Профиль
                </DropdownMenuItem>

                {/* Новый пункт: Купить токены */}
                <DropdownMenuItem
                  data-testid="user-nav-item-buy-coins"
                  className="cursor-pointer"
                  onSelect={() => router.push('/profile')}
                >
                  Купить токены
                </DropdownMenuItem>

                {/* Новый пункт: Связаться с нами */}
                <DropdownMenuItem
                  data-testid="user-nav-item-contact"
                  className="cursor-pointer"
                  onSelect={() => {
                    window.location.href = 'mailto:hey@aporto.tech';
                  }}
                >
                  Связаться с нами
                </DropdownMenuItem>

                {/* Новый пункт: Пригласить друга */}
                <DropdownMenuItem
                  data-testid="user-nav-item-invite"
                  className="cursor-pointer flex flex-col items-start"
                  onSelect={() => router.push('/invite')}
                >
                  <span>Получить бонусы</span>
                  <span className="text-xs text-muted-foreground">
                    до 45 200 токенов!
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (status === 'loading') {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  if (isGuest) {
                    router.push('/login');
                  } else {
                    signOut({
                      redirectTo: '/',
                    });
                  }
                }}
              >
                {isGuest ? 'Войти в аккаунт' : 'Выйти'}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
