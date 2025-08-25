import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { ModelProvider } from '@/contexts/model-context';
import { getUserSubscriptionStatus } from '@/lib/db/queries';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const chatModelFromCookie = cookieStore.get('chat-model');

  const userId = session?.user?.id;

  let subscriptionStatus = null;
  if (userId) {
    subscriptionStatus = await getUserSubscriptionStatus(userId);
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '827426040729298');
          fbq('track', 'PageView');
        `}
      </Script>
      <Script id="vk-pixel" strategy="afterInteractive">
        {`
          !function(){var t=document.createElement("script");
          t.type="text/javascript",t.async=!0,
          t.src="https://vk.com/js/api/openapi.js?169",
          t.onload=function(){VK.Retargeting.Init("3673771");
          VK.Retargeting.Hit();},
          document.head.appendChild(t)}();
        `}
      </Script>
      <DataStreamProvider>
        <ModelProvider initialModel={chatModelFromCookie?.value}>
          <SidebarProvider defaultOpen={!isCollapsed}>
            {session && <AppSidebar user={session.user} session={session} />}
            <SidebarInset className="h-screen md:h-dvh overflow-hidden">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ModelProvider>
      </DataStreamProvider>
    </>
  );
}
