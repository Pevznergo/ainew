import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateUserPassword } from '@/lib/db/queries';

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (!newPassword) {
      return NextResponse.json({ error: 'password_empty' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'password_too_short' }, { status: 400 });
    }

    await updateUserPassword(session.user.id, currentPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Password update error:', e);
    const msg = String(e?.message || 'unknown_error');
    if (msg.includes('forbidden:wrong_password')) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 403 });
    }
    if (msg.includes('bad_request:password_too_short')) {
      return NextResponse.json({ error: 'password_too_short' }, { status: 400 });
    }
    if (msg.includes('not_found:database')) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
