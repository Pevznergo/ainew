'use client';

import type { User, Session } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon, HomeIcon, MessageIcon, UserIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
 

export function AppSidebar({
  user,
  session,
}: {
  user: User;
  session: Session | undefined;
}) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer group-data-[collapsible=icon]:hidden">
                Aporto
              </span>
            </Link>
            <div className="flex flex-col items-start gap-2 group-data-[collapsible=icon]:items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit justify-start gap-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/feed');
                  }}
                  aria-label="Главная"
                >
                  <img src="/images/logo.png" alt="Главная" className="h-4 w-4 rounded-full object-cover" />
                  <span className="text-sm text-foreground/80 group-data-[collapsible=icon]:hidden">Главная</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit justify-start gap-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push(`/u/${session?.user?.nickname || session?.user?.id || user.id}`);
                  }}
                  aria-label="Мой канал"
                >
                  <HomeIcon size={16} />
                  <span className="text-sm text-foreground/80 group-data-[collapsible=icon]:hidden">Мой канал</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit justify-start gap-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/feed');
                  }}
                  aria-label="Лента"
                >
                  <MessageIcon size={16} />
                  <span className="text-sm text-foreground/80 group-data-[collapsible=icon]:hidden">Лента</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit justify-start gap-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/profile');
                  }}
                  aria-label="Профиль"
                >
                  <UserIcon />
                  <span className="text-sm text-foreground/80 group-data-[collapsible=icon]:hidden">Профиль</span>
                </Button>
              </div>

              {/* Новый чат перемещен ниже Профиля с небольшим отступом */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit justify-start gap-2 border border-green-600/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                  aria-label="Новый чат"
                >
                  <PlusIcon />
                  <span className="text-sm group-data-[collapsible=icon]:hidden">Новый чат</span>
                </Button>
              </div>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>
        {user && <SidebarUserNav session={{ user } as Session} />}
      </SidebarFooter>
    </Sidebar>
  );
}
