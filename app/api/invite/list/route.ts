import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { listInvitesByOwner } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const rows = await listInvitesByOwner(session.user.id);
    return NextResponse.json(rows);
  } catch (e) {
    return new NextResponse('Failed to list invites', { status: 500 });
  }
}
