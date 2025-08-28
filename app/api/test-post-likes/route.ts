import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkPostLikes10, getUserById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST POST LIKES] Starting post likes test...');

    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse the request body to get chatId
    const body = await request.json().catch(() => ({}));
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 },
      );
    }

    console.log('[TEST POST LIKES] Testing with chatId:', chatId);

    // Get user details first
    const user = await getUserById(session.user.id);
    console.log('[TEST POST LIKES] User details:', {
      id: user?.id,
      email: user?.email,
      taskPostLikes10: user?.task_post_likes_10,
      balance: user?.balance,
    });

    // Test the checkPostLikes10 function
    console.log('[TEST POST LIKES] Calling checkPostLikes10...');
    await checkPostLikes10(chatId);
    console.log('[TEST POST LIKES] checkPostLikes10 completed successfully');

    // Get updated user details
    const updatedUser = await getUserById(session.user.id);
    console.log('[TEST POST LIKES] Updated user details:', {
      id: updatedUser?.id,
      taskPostLikes10: updatedUser?.task_post_likes_10,
      balance: updatedUser?.balance,
    });

    return NextResponse.json({
      success: true,
      message: 'Post likes check completed',
      user: {
        id: updatedUser?.id,
        taskPostLikes10: updatedUser?.task_post_likes_10,
        balance: updatedUser?.balance,
      },
      chatId,
    });
  } catch (error) {
    console.error('[TEST POST LIKES] Error in post likes test:', error);
    console.error('[TEST POST LIKES] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
