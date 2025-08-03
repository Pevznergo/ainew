import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDemoByName } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const demo = await getDemoByName(name);

    if (!demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    return NextResponse.json(demo);
  } catch (error) {
    console.error('Error fetching demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
