import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { completeTask } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completed } = body;

    if (!completed) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Complete the Twitter task
    const updatedUser = await completeTask(session.user.id, 'SOCIAL_TWITTER');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tokensEarned: 300,
      message: 'Twitter task completed! You earned 300 tokens.',
    });
  } catch (error) {
    console.error('Twitter task completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
