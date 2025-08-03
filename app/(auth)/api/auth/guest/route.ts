import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobileNetwork =
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad');

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment && !isMobileNetwork,
  });

  if (token) {
    return NextResponse.redirect(new URL('/main', request.url));
  }

  // Определяем куда редиректить
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirectUrl');
  const targetUrl = redirectUrl || '/main';

  return signIn('guest', {
    redirect: true,
    redirectTo: targetUrl,
  });
}
