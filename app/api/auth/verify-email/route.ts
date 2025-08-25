import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyEmailToken, completeTask } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=invalid-token', request.url),
      );
    }

    // Verify the email token
    const user = await verifyEmailToken(token);

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=invalid-or-expired-token', request.url),
      );
    }

    // Complete the email verification task if not already completed
    if (!user.task_email_verified) {
      await completeTask(user.id, 'EMAIL_VERIFICATION');
    }

    // Redirect to success page or dashboard
    return NextResponse.redirect(new URL('/invite?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/login?error=verification-failed', request.url),
    );
  }
}
