import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getUserBio,
  updateUserBio,
  checkProfileCompletion,
} from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const bio = await getUserBio(session.user.id);
    return NextResponse.json({ bio });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const bio = String(body?.bio ?? '');
    const updated = await updateUserBio(session.user.id, bio);

    // Check for profile completion and award tokens if appropriate
    await checkProfileCompletion(session.user.id);

    return NextResponse.json({ id: updated.id, bio: updated.bio });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('bad_request:bio_too_long')) {
      return NextResponse.json({ error: 'bio_too_long' }, { status: 400 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
