'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  MenuIcon,
  PlusIcon,
  HomeIcon,
  MessageIcon,
  UserIcon,
} from '@/components/icons';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import type { Session } from 'next-auth';

export default function FeedMobileNav({
  session,
}: { session: Session | null }) {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Лента</div>
        <Sheet>
          <SheetTrigger
            aria-label="Открыть меню"
            className="rounded-md p-2 hover:bg-muted"
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85%] sm:max-w-sm">
            <div className="p-4 space-y-4">
              <nav className="flex flex-col gap-2 text-sm">
                <Link
                  href="/"
                  className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Image
                      src="/images/logo.png"
                      alt="Главная"
                      width={16}
                      height={16}
                      className="rounded-full object-cover"
                    />
                    <span>Главная</span>
                  </span>
                </Link>
                <Link
                  href={`/u/${session?.user?.nickname || session?.user?.id}`}
                  className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <HomeIcon size={16} />
                    <span>Мой канал</span>
                  </span>
                </Link>
                <Link
                  href="/feed"
                  className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageIcon size={16} />
                    <span>Лента</span>
                  </span>
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-xl px-3 py-2 border border-border bg-muted hover:bg-accent text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserIcon />
                    <span>Профиль</span>
                  </span>
                </Link>
                <Link
                  href="/"
                  className="mt-2 block rounded-xl px-3 py-2 border border-green-600/40 bg-green-500/10 text-green-600 dark:text-green-300 hover:bg-green-500/20"
                >
                  <span className="inline-flex items-center gap-2">
                    <PlusIcon />
                    <span>Новый чат</span>
                  </span>
                </Link>
              </nav>
              {session && (
                <div className="pt-2">
                  <SidebarUserNav session={session} />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
