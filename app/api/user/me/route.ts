import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const [row] = await db
    .select({ id: user.id, email: user.email, type: user.type })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!row) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json(row);
}
