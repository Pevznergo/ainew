'use client';

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function SidebarProviderClient({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}
