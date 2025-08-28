import { type NextRequest, NextResponse } from 'next/server';
import { checkFirstChat, getUserById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Starting first chat test...');

    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[TEST] Testing with user ID:', session.user.id);

    // Get user details first
    const user = await getUserById(session.user.id);
    console.log('[TEST] User details:', {
      id: user?.id,
      email: user?.email,
      taskFirstChat: user?.task_first_chat,
      balance: user?.balance,
    });

    // Test the checkFirstChat function
    console.log('[TEST] Calling checkFirstChat...');
    await checkFirstChat(session.user.id);
    console.log('[TEST] checkFirstChat completed successfully');

    // Get updated user details
    const updatedUser = await getUserById(session.user.id);
    console.log('[TEST] Updated user details:', {
      id: updatedUser?.id,
      taskFirstChat: updatedUser?.task_first_chat,
      balance: updatedUser?.balance,
    });

    return NextResponse.json({
      success: true,
      message: 'First chat check completed',
      user: {
        id: updatedUser?.id,
        taskFirstChat: updatedUser?.task_first_chat,
        balance: updatedUser?.balance,
      },
    });
  } catch (error) {
    console.error('[TEST] Error in first chat test:', error);
    console.error('[TEST] Error details:', {
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
