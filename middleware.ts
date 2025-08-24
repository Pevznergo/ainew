import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  console.log('=== Middleware Debug ===');
  console.log('Path:', request.nextUrl.pathname);
  console.log('User-Agent:', request.headers.get('user-agent'));
  console.log('X-Forwarded-For:', request.headers.get('x-forwarded-for'));
  console.log('X-Real-IP:', request.headers.get('x-real-ip'));
  console.log('CF-Connecting-IP:', request.headers.get('cf-connecting-ip'));
  console.log('X-Forwarded-Proto:', request.headers.get('x-forwarded-proto'));
  console.log('Host:', request.headers.get('host'));
  console.log('=======================');

  const { pathname } = request.nextUrl;

  // Allow crawlers to access sitemap and robots without auth/redirects
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Исключаем главную страницу, страницу наград, чат и все страницы в директории /my
  // Также ПУБЛИЧНЫЕ страницы каналов пользователей в /u/* — доступны без авторизации и индексируются
  if (
    pathname === '/main' ||
    pathname === '/rewards' ||
    pathname === '/chat' ||
    pathname.startsWith('/chat/') ||
    pathname.startsWith('/my/') ||
    pathname === '/u' ||
    pathname.startsWith('/u/')
  ) {
    return NextResponse.next();
  }

  // Проверяем существующий токен
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Если нет токена, создаем гостя только при первом посещении
  if (!token) {
    // Проверяем, есть ли уже гость в cookies
    const hasGuestSession =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token');

    if (!hasGuestSession) {
      const redirectUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Исключите API routes и файлы индексации
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
