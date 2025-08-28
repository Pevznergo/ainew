import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkAllTasksCompleted, getUserById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST ALL TASKS] Starting all tasks completion test...');

    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[TEST ALL TASKS] Testing with userId:', session.user.id);

    // Get user details first
    const user = await getUserById(session.user.id);
    console.log('[TEST ALL TASKS] User details before:', {
      id: user?.id,
      email: user?.email,
      taskAllCompleted: user?.task_all_completed,
      balance: user?.balance,
      allTasksStatus: {
        email: user?.task_email_verified,
        profile: user?.task_profile_completed,
        firstChat: user?.task_first_chat,
        firstShare: user?.task_first_share,
        twitter: user?.task_social_twitter,
        facebook: user?.task_social_facebook,
        vk: user?.task_social_vk,
        telegram: user?.task_social_telegram,
        reddit: user?.task_social_reddit,
        postLikes: user?.task_post_likes_10,
      },
    });

    // Test the checkAllTasksCompleted function
    console.log('[TEST ALL TASKS] Calling checkAllTasksCompleted...');
    await checkAllTasksCompleted(session.user.id);
    console.log(
      '[TEST ALL TASKS] checkAllTasksCompleted completed successfully',
    );

    // Get updated user details
    const updatedUser = await getUserById(session.user.id);
    console.log('[TEST ALL TASKS] Updated user details after:', {
      id: updatedUser?.id,
      taskAllCompleted: updatedUser?.task_all_completed,
      balance: updatedUser?.balance,
    });

    return NextResponse.json({
      success: true,
      message: 'All tasks completion check completed',
      user: {
        id: updatedUser?.id,
        taskAllCompleted: updatedUser?.task_all_completed,
        balance: updatedUser?.balance,
        allTasksStatus: {
          email: updatedUser?.task_email_verified,
          profile: updatedUser?.task_profile_completed,
          firstChat: updatedUser?.task_first_chat,
          firstShare: updatedUser?.task_first_share,
          twitter: updatedUser?.task_social_twitter,
          facebook: updatedUser?.task_social_facebook,
          vk: updatedUser?.task_social_vk,
          telegram: updatedUser?.task_social_telegram,
          reddit: updatedUser?.task_social_reddit,
          postLikes: updatedUser?.task_post_likes_10,
        },
      },
    });
  } catch (error) {
    console.error(
      '[TEST ALL TASKS] Error in all tasks completion test:',
      error,
    );
    console.error('[TEST ALL TASKS] Error details:', {
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
