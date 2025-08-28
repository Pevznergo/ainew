import crypto from 'node:crypto';

export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getEmailVerificationExpiry(): Date {
  // Token expires in 24 hours
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export function createVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/verify-email?token=${token}`;
}

// Task configuration with rewards
export const TASK_REWARDS = {
  EMAIL_VERIFICATION: 100,
  PROFILE_COMPLETION: 100,
  FIRST_CHAT: 100,
  FIRST_SHARE: 100,
  SOCIAL_TWITTER: 300,
  SOCIAL_FACEBOOK: 300,
  SOCIAL_VK: 300,
  SOCIAL_TELEGRAM: 300,
  SOCIAL_REDDIT: 300, // Reddit review task
  FRIEND_INVITATION: 200, // per friend
  FRIEND_PRO_SUBSCRIPTION: 1000, // per friend who subscribes to PRO
  POST_LIKES_10: 300, // when user's post gets 10 likes
  ALL_TASKS_COMPLETED: 10000, // completion bonus for finishing all tasks
} as const;

export const MAX_TOTAL_TASK_TOKENS = 41400;

export type TaskType = keyof typeof TASK_REWARDS;

export function calculateTaskProgress(user: any): {
  totalTokens: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
} {
  let totalTokens = 0;
  let completedTasks = 0;
  const totalTasks =
    Object.keys(TASK_REWARDS).length + user.task_friends_invited || 0;

  if (user.task_email_verified) {
    totalTokens += TASK_REWARDS.EMAIL_VERIFICATION;
    completedTasks++;
  }

  if (user.task_profile_completed) {
    totalTokens += TASK_REWARDS.PROFILE_COMPLETION;
    completedTasks++;
  }

  if (user.task_first_chat) {
    totalTokens += TASK_REWARDS.FIRST_CHAT;
    completedTasks++;
  }

  if (user.task_first_share) {
    totalTokens += TASK_REWARDS.FIRST_SHARE;
    completedTasks++;
  }

  if (user.task_social_twitter) {
    totalTokens += TASK_REWARDS.SOCIAL_TWITTER;
    completedTasks++;
  }

  if (user.task_social_facebook) {
    totalTokens += TASK_REWARDS.SOCIAL_FACEBOOK;
    completedTasks++;
  }

  if (user.task_social_vk) {
    totalTokens += TASK_REWARDS.SOCIAL_VK;
    completedTasks++;
  }

  if (user.task_social_telegram) {
    totalTokens += TASK_REWARDS.SOCIAL_TELEGRAM;
    completedTasks++;
  }

  if (user.task_social_reddit) {
    totalTokens += TASK_REWARDS.SOCIAL_REDDIT;
    completedTasks++;
  }

  // Friend invitations
  const friendTokens =
    (user.task_friends_invited || 0) * TASK_REWARDS.FRIEND_INVITATION;
  totalTokens += friendTokens;

  // Friend PRO subscriptions
  const friendProTokens =
    (user.task_friends_pro_subscribed || 0) *
    TASK_REWARDS.FRIEND_PRO_SUBSCRIPTION;
  totalTokens += friendProTokens;

  // Post gets 10 likes
  if (user.task_post_likes_10) {
    totalTokens += TASK_REWARDS.POST_LIKES_10;
    completedTasks++;
  }

  // All tasks completed bonus
  if (user.task_all_completed) {
    totalTokens += TASK_REWARDS.ALL_TASKS_COMPLETED;
    completedTasks++;
  }

  const progressPercentage = Math.min(
    (totalTokens / MAX_TOTAL_TASK_TOKENS) * 100,
    100,
  );

  return {
    totalTokens,
    completedTasks,
    totalTasks,
    progressPercentage,
  };
}
