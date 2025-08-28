import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkFriendProSubscription, getUserById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST PRO] Starting friend PRO subscription test...');

    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[TEST PRO] Testing with user ID:', session.user.id);

    // Get user details first
    const user = await getUserById(session.user.id);
    console.log('[TEST PRO] User details:', {
      id: user?.id,
      email: user?.email,
      taskFriendsProSubscribed: user?.task_friends_pro_subscribed,
      balance: user?.balance,
      referredBy: user?.referred_by,
    });

    // Test the checkFriendProSubscription function
    console.log('[TEST PRO] Calling checkFriendProSubscription...');
    await checkFriendProSubscription(session.user.id);
    console.log('[TEST PRO] checkFriendProSubscription completed successfully');

    // Get updated user details
    const updatedUser = await getUserById(session.user.id);
    console.log('[TEST PRO] Updated user details:', {
      id: updatedUser?.id,
      taskFriendsProSubscribed: updatedUser?.task_friends_pro_subscribed,
      balance: updatedUser?.balance,
    });

    return NextResponse.json({
      success: true,
      message: 'Friend PRO subscription check completed',
      user: {
        id: updatedUser?.id,
        taskFriendsProSubscribed: updatedUser?.task_friends_pro_subscribed,
        balance: updatedUser?.balance,
        referredBy: updatedUser?.referred_by,
      },
    });
  } catch (error) {
    console.error('[TEST PRO] Error in friend PRO subscription test:', error);
    console.error('[TEST PRO] Error details:', {
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
