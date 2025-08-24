import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const revalidate = 3600; // 1 hour

const baseUrl = 'https://aporto.tech';

function hasPage(segments: string[]) {
  return fs.existsSync(
    path.join(process.cwd(), 'app', ...segments, 'page.tsx'),
  );
}

async function getUrls() {
  // Top level static routes
  const topLevelSlugs = [
    '',
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

  // /my/* dynamic directories
  const myDir = path.join(process.cwd(), 'app', 'my');
  let myRoutes: { url: string; lastModified: Date }[] = [];
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

  // Optional DB-powered chat routes
  let chatRoutes: { url: string; lastModified: Date }[] = [];
  try {
    if (process.env.POSTGRES_URL) {
      const [{ db }, { chat }, { eq }] = await Promise.all([
        import('@/lib/db'),
        import('@/lib/db/schema'),
        import('drizzle-orm'),
      ]);

      const chats = await db
        .select({ id: chat.id, updatedAt: chat.createdAt })
        .from(chat)
        .where(eq(chat.visibility, 'public'));

      chatRoutes = chats.map((c) => ({
        url: `${baseUrl}/chat/${c.id}`,
        lastModified: new Date(c.updatedAt),
      }));
    }
  } catch {
    // ignore DB errors to avoid 5xx
  }

  // User profile routes
  let userRoutes: { url: string; lastModified: Date }[] = [];
  try {
    if (process.env.POSTGRES_URL) {
      const [{ db }, { user }, { and, isNotNull, ne }] = await Promise.all([
        import('@/lib/db'),
        import('@/lib/db/schema'),
        import('drizzle-orm'),
      ]);

      const users = await db
        .select({
          id: user.id,
          nickname: user.nickname,
          updatedAt: user.createdAt,
        })
        .from(user)
        .where(
          // Only include users who have public content (with nickname preferred)
          and(isNotNull(user.nickname), ne(user.nickname, '')),
        );

      userRoutes = users
        .filter((u) => u.nickname?.trim())
        .map((u) => ({
          url: `${baseUrl}/u/${encodeURIComponent(u.nickname?.trim() || u.id)}`,
          lastModified: new Date(u.updatedAt),
        }));
    }
  } catch {
    // ignore DB errors to avoid 5xx
  }

  return [...staticRoutes, ...myRoutes, ...chatRoutes, ...userRoutes];
}

function toXml(urls: { url: string; lastModified?: Date }[]) {
  const urlset = urls
    .map((u) => {
      const lastmod = u.lastModified
        ? new Date(u.lastModified).toISOString()
        : undefined;
      return [
        '  <url>',
        `    <loc>${u.url}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : undefined,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

export async function GET() {
  const urls = await getUrls();
  const body = toXml(urls);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${revalidate}, s-maxage=${revalidate}`,
    },
  });
}
