import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { chat } from '@/lib/db/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ainew.io';

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai`,
      lastModified: new Date(),
    },
  ];

  const chats = await db.select({ id: chat.id, updatedAt: chat.createdAt }).from(chat);

  const chatRoutes = chats.map(c => ({
    url: `${baseUrl}/chat/${c.id}`,
    lastModified: c.updatedAt,
  }));

  return [...staticRoutes, ...chatRoutes];
}
