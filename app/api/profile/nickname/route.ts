import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateUserNickname, checkProfileCompletion } from '@/lib/db/queries';

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nickname = String(body?.nickname ?? '').trim();

    if (!nickname) {
      return NextResponse.json({ error: 'nickname_empty' }, { status: 400 });
    }
    if (nickname.length > 64) {
      return NextResponse.json({ error: 'nickname_too_long' }, { status: 400 });
    }
    if (nickname !== nickname.toLowerCase()) {
      return NextResponse.json(
        { error: 'nickname_uppercase' },
        { status: 400 },
      );
    }

    const updated = await updateUserNickname(session.user.id, nickname);

    // Check for profile completion and award tokens if appropriate
    await checkProfileCompletion(session.user.id);

    return NextResponse.json({ id: updated.id, nickname: updated.nickname });
  } catch (e: any) {
    console.error('Nickname update error:', e);
    const msg = String(e?.message || 'unknown_error');
    if (msg.includes('conflict:nickname_taken')) {
      return NextResponse.json({ error: 'nickname_taken' }, { status: 409 });
    }
    if (msg.includes('bad_request:nickname_empty')) {
      return NextResponse.json({ error: 'nickname_empty' }, { status: 400 });
    }
    if (msg.includes('bad_request:nickname_too_long')) {
      return NextResponse.json({ error: 'nickname_too_long' }, { status: 400 });
    }
    if (msg.includes('bad_request:nickname_uppercase')) {
      return NextResponse.json(
        { error: 'nickname_uppercase' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
