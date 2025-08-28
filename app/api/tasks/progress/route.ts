import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserTaskProgress } from '@/lib/db/queries';
import { calculateTaskProgress } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserTaskProgress(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const taskProgress = calculateTaskProgress(user);

    return NextResponse.json({
      taskProgress,
      user: {
        email_verified: user.email_verified,
        task_email_verified: user.task_email_verified,
        task_profile_completed: user.task_profile_completed,
        task_first_chat: user.task_first_chat,
        task_first_share: user.task_first_share,
        task_social_twitter: user.task_social_twitter,
        task_social_facebook: user.task_social_facebook,
        task_social_vk: user.task_social_vk,
        task_social_telegram: user.task_social_telegram,
        task_social_reddit: user.task_social_reddit,
        task_friends_invited: user.task_friends_invited,
        task_friends_pro_subscribed: user.task_friends_pro_subscribed,
        task_post_likes_10: user.task_post_likes_10,
        task_all_completed: user.task_all_completed,
        task_tokens_earned: user.task_tokens_earned,
        nickname: user.nickname,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Error fetching task progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
