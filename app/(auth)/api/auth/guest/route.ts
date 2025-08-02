import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('=== Guest Route Debug ===');
  console.log('Request URL:', request.url);
  console.log('User-Agent:', request.headers.get('user-agent'));

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  console.log('Token in guest route:', !!token);

  if (token) {
    console.log('Token found, redirecting to /main');
    return NextResponse.redirect(new URL('/main', request.url));
  }

  console.log('Creating guest session...');

  try {
    const result = await signIn('guest', {
      redirect: true,
      redirectTo: '/main',
      callbackUrl: '/main',
    });

    console.log('SignIn result:', result);
    return result;
  } catch (error) {
    console.error('Error in guest signIn:', error);
    // Fallback redirect
    return NextResponse.redirect(new URL('/main', request.url));
  }
}
