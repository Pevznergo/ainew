import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createInvite } from '@/lib/db/queries';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let availableCount = 4;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.availableCount === 'number' && body.availableCount > 0) {
      availableCount = body.availableCount;
    }
  } catch (_) {}

  try {
    const invite = await createInvite(session.user.id, availableCount);
    return NextResponse.json(invite);
  } catch (e) {
    return new NextResponse('Failed to create invite', { status: 500 });
  }
}
