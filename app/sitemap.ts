import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { chat } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aporto.tech';

  // Helper to safely check if a route exists (has page.tsx)
  const hasPage = (segments: string[]) =>
    fs.existsSync(path.join(process.cwd(), 'app', ...segments, 'page.tsx'));

  // Collect top-level static routes (only if present)
  const topLevelSlugs = [
    '', // root
    'login',
    'register',
    'ai',
    'main',
    'profile',
    'invite',
    'subscriptions',
    'privacy',
    'tos',
    'tos-subscription',
    'net',
  ];

  const staticRoutes = topLevelSlugs
    .filter((slug) => (slug ? hasPage([slug]) : true))
    .map((slug) => ({
      url: slug ? `${baseUrl}/${slug}` : baseUrl,
      lastModified: new Date(),
    }));

  // Collect all /my/* pages by scanning directories with page.tsx
  const myDir = path.join(process.cwd(), 'app', 'my');
  let myRoutes: MetadataRoute.Sitemap = [];
  try {
    const entries = fs.readdirSync(myDir, { withFileTypes: true });
    myRoutes = entries
      .filter((e) => e.isDirectory())
      .filter((e) => hasPage(['my', e.name]))
      .map((e) => {
        const pagePath = path.join(myDir, e.name, 'page.tsx');
        const stat = fs.statSync(pagePath);
        return {
          url: `${baseUrl}/my/${e.name}`,
          lastModified: stat.mtime,
        };
      });
  } catch {
    // ignore if /my does not exist
  }

  const chats = await db
    .select({ id: chat.id, updatedAt: chat.createdAt })
    .from(chat)
    .where(eq(chat.visibility, 'public'));

  const chatRoutes = chats.map((c) => ({
    url: `${baseUrl}/chat/${c.id}`,
    lastModified: c.updatedAt,
  }));

  return [...staticRoutes, ...myRoutes, ...chatRoutes];
}
