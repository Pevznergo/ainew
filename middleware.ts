import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Исключаем статические файлы и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/ping')
  ) {
    return NextResponse.next();
  }

  // Определяем, является ли это мобильной сетью
  const userAgent = request.headers.get('user-agent') || '';
  const isMobileNetwork =
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad');

  // Проверяем существующий токен с учетом мобильных сетей
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment && !isMobileNetwork,
  });

  // Если есть токен, пропускаем
  if (token) {
    const isGuest = guestRegex.test(token?.email ?? '');

    // Редирект только если авторизованный пользователь пытается зайти на страницы авторизации
    if (!isGuest && ['/login', '/register'].includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // Проверяем, есть ли уже гость в cookies (включая мобильные варианты)
  const hasGuestSession =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('__Host-next-auth.session-token') ||
    request.cookies.get('authjs.session-token');

  // Создаем гостя только если нет сессии
  if (!hasGuestSession) {
    // Для главной страницы создаем гостя напрямую без редиректа
    if (pathname === '/' || pathname === '/main') {
      const response = NextResponse.redirect(
        new URL('/api/auth/guest', request.url),
      );
      return response;
    }

    // Для других страниц используем редирект с callback
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Исключаем статические файлы и API
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
