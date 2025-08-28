'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/toast';

type Invite = {
  id: string;
  code: string;
  available_count: number;
  used_count: number;
  created_at: string;
};

type TaskProgress = {
  totalTokens: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
};

type UserTaskData = {
  email_verified: boolean;
  task_email_verified: boolean;
  task_profile_completed: boolean;
  task_first_chat: boolean;
  task_first_share: boolean;
  task_social_twitter: boolean;
  task_social_facebook: boolean;
  task_social_vk: boolean;
  task_social_telegram: boolean;
  task_social_reddit: boolean;
  task_friends_invited: number;
  task_friends_pro_subscribed: number;
  task_post_likes_10: boolean;
  task_all_completed: boolean;
  task_tokens_earned: number;
  nickname: string | null;
  bio: string | null;
};

// Компонент скелетона для загрузки
function LoadingSkeleton() {
  return (
    <div className="font-geist font-sans bg-[#0b0b0f] min-h-screen flex flex-col text-neutral-100">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="w-20 h-6 bg-neutral-700 rounded animate-pulse" />
          <div className="w-24 h-8 bg-neutral-700 rounded animate-pulse" />
          <div className="w-16 h-10 bg-neutral-700 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6 flex-1 w-full">
        {/* Реферальная ссылка skeleton */}
        <section className="mb-12">
          <div className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center w-full">
            <div className="w-64 h-8 bg-neutral-700 rounded animate-pulse mb-4" />
            <div className="flex w-full max-w-2xl mb-3">
              <div className="flex-1 h-12 bg-neutral-700 rounded-l-lg animate-pulse" />
              <div className="w-24 h-12 bg-neutral-700 rounded-r-lg animate-pulse" />
            </div>
            <div className="w-80 h-6 bg-neutral-700 rounded animate-pulse" />
          </div>
        </section>

        {/* Бонусные шаги skeleton */}
        <section className="mb-16">
          <div className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-10">
            <div className="w-96 h-12 bg-neutral-700/50 rounded animate-pulse mx-auto mb-3" />
            <div className="w-80 h-6 bg-neutral-700/50 rounded animate-pulse mx-auto mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map(() => (
              <div
                key={Math.random()}
                className="rounded-3xl border border-white/10 p-8 bg-white/[0.04] flex flex-col items-center"
              >
                <div className="size-16 bg-neutral-700 rounded-xl animate-pulse mb-5" />
                <div className="w-32 h-6 bg-neutral-700 rounded animate-pulse mb-2" />
                <div className="w-48 h-16 bg-neutral-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA skeleton */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] text-center mb-16">
          <div className="w-96 h-10 bg-neutral-700/50 rounded animate-pulse mx-auto mb-8" />
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <div className="w-40 h-12 bg-neutral-700/50 rounded animate-pulse" />
            <div className="w-48 h-12 bg-neutral-700/50 rounded animate-pulse" />
          </div>
        </section>

        {/* Условия skeleton */}
        <section className="rounded-3xl border border-white/10 p-10 bg-white/[0.04] mb-8">
          <div className="w-64 h-10 bg-neutral-700 rounded animate-pulse mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {Array.from({ length: 6 }).map(() => (
              <div
                key={Math.random()}
                className="rounded-xl border border-white/10 p-6 bg-white/[0.02]"
              >
                <div className="w-32 h-6 bg-neutral-700 rounded animate-pulse mb-3" />
                <div className="w-full h-20 bg-neutral-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="w-full h-16 bg-neutral-700 rounded-lg animate-pulse" />
        </section>
      </main>
    </div>
  );
}

export default function InvitePage() {
  const { data: session, status } = useSession();
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [userData, setUserData] = useState<UserTaskData | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  // invite is created automatically (if missing) on load; no manual button

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Получаем реферальный код пользователя
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/referral/link');
        const data = await response.json();
        setReferralLink(data.referralLink);
        try {
          const url = new URL(data.referralLink);
          setReferralCode(url.searchParams.get('ref') || '');
        } catch (_) {}
      } catch (error) {
        console.error('Failed to fetch referral link:', error);
        setReferralLink('https://aporto.tech/api/auth/guest');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
  }, [session, status]);

  // Ensure invite exists and load it for current user (not for guests)
  useEffect(() => {
    const loadInvites = async () => {
      if (!session?.user) return;
      try {
        // ensure there is an invite row bound to user's referral_code
        await fetch('/api/invite/create', { method: 'POST' }).catch(() => {});

        const res = await fetch('/api/invite/list');
        if (!res.ok) throw new Error('Failed to fetch invites');
        const data = await res.json();
        setInvites(data || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (status === 'authenticated') {
      loadInvites();
    }
  }, [session, status]);

  // Load task progress
  const loadTaskProgress = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/tasks/progress');
      if (!res.ok) throw new Error('Failed to fetch task progress');
      const data = await res.json();
      setTaskProgress(data.taskProgress);
      setUserData(data.user);
    } catch (e) {
      console.error('Failed to load task progress:', e);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadTaskProgress();
    }
  }, [session, status, loadTaskProgress]);

  // Check for email verification success and refresh data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true' && status === 'authenticated') {
      // Show success message
      toast({
        type: 'success',
        description: 'Email успешно подтвержден! Вы получили 100 токенов.',
      });

      // Refresh task progress data
      setTimeout(() => {
        loadTaskProgress();
      }, 1000); // Small delay to ensure backend has processed the verification

      // Clean up URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [status, loadTaskProgress]);

  // Refresh data when user returns to the page (e.g., after email verification)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        loadTaskProgress();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, loadTaskProgress]);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          type: 'success',
          description: data.message || 'Письмо отправлено!',
        });
        // Refresh task progress in case the email was already verified
        setTimeout(() => {
          loadTaskProgress();
        }, 500);
      } else {
        toast({
          type: 'error',
          description: data.error || 'Ошибка отправки письма',
        });
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'Ошибка отправки письма',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      // Можно добавить уведомление об успешном копировании
      alert('Ссылка скопирована!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleTwitterShare = async () => {
    const tweetUrl = 'https://x.com/pevznerigor/status/1960053767291781488';
    const twitterUrl = `https://twitter.com/intent/retweet?tweet_id=1960053767291781488&related=pevznerigor`;

    // Show immediate feedback
    toast({
      type: 'success',
      description:
        'Открываем Twitter для репоста. После репоста вернитесь на эту страницу.',
    });

    // Open Twitter in new tab
    const newWindow = window.open(twitterUrl, '_blank');

    if (!newWindow) {
      toast({
        type: 'error',
        description:
          'Не удалось открыть Twitter. Пожалуйста, разрешите всплывающие окна.',
      });
      return;
    }

    // Show confirmation dialog after a delay
    setTimeout(() => {
      // Check if user is still on the page (not switched to Twitter tab)
      if (document.hasFocus()) {
        showTwitterConfirmation();
      } else {
        // If user is on Twitter tab, wait for them to return
        const handleFocus = () => {
          setTimeout(() => {
            showTwitterConfirmation();
            window.removeEventListener('focus', handleFocus);
          }, 1000);
        };
        window.addEventListener('focus', handleFocus);

        // Fallback: show confirmation after 30 seconds regardless
        setTimeout(() => {
          showTwitterConfirmation();
          window.removeEventListener('focus', handleFocus);
        }, 30000);
      }
    }, 3000);
  };

  const showTwitterConfirmation = () => {
    const confirmed = window.confirm(
      '🐦 Сделали репост в Twitter?\n\n' +
        'Если вы успешно сделали репост нашего поста, нажмите "OK" чтобы получить 300 токенов.\n\n' +
        'Если нет - нажмите "Отмена" и попробуйте снова.',
    );

    if (confirmed) {
      completeTwitterTask();
    } else {
      toast({
        type: 'success',
        description: 'Нет проблем! Вы можете попробовать снова в любое время.',
      });
    }
  };

  const completeTwitterTask = async () => {
    try {
      const response = await fetch('/api/tasks/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          type: 'success',
          description:
            data.message ||
            'Twitter задание выполнено! Вы получили 300 токенов.',
        });

        // Refresh task progress
        setTimeout(() => {
          loadTaskProgress();
        }, 1000);
      } else {
        toast({
          type: 'error',
          description: data.error || 'Ошибка при выполнении задания.',
        });
      }
    } catch (error) {
      console.error('Error completing Twitter task:', error);
      toast({
        type: 'error',
        description: 'Ошибка при выполнении задания. Попробуйте позже.',
      });
    }
  };

  const handleRedditShare = () => {
    // Open Reddit in a new window
    const redditUrl =
      'https://reddit.com/submit?url=https://aporto.tech&title=Aporto%20-%20AI%20chatbot%20platform';
    const popup = window.open(
      redditUrl,
      '_blank',
      'width=600,height=600,scrollbars=yes,resizable=yes',
    );

    if (!popup) {
      toast({
        type: 'error',
        description:
          'Не удалось открыть Reddit. Пожалуйста, разрешите всплывающие окна.',
      });
      return;
    }

    // Show confirmation dialog after a delay
    setTimeout(() => {
      // Check if user is still on the page (not switched to Reddit tab)
      if (document.hasFocus()) {
        showRedditConfirmation();
      } else {
        // If user is on Reddit tab, wait for them to return
        const handleFocus = () => {
          setTimeout(() => {
            showRedditConfirmation();
            window.removeEventListener('focus', handleFocus);
          }, 1000);
        };
        window.addEventListener('focus', handleFocus);

        // Fallback: show confirmation after 30 seconds regardless
        setTimeout(() => {
          showRedditConfirmation();
          window.removeEventListener('focus', handleFocus);
        }, 30000);
      }
    }, 3000);
  };

  const showRedditConfirmation = () => {
    const confirmed = window.confirm(
      '📝 Написали отзыв на Reddit?\n\n' +
        'Если вы успешно написали отзыв о нашем сервисе на Reddit, нажмите "OK" чтобы получить 300 токенов.\n\n' +
        'Если нет - нажмите "Отмена" и попробуйте снова.',
    );

    if (confirmed) {
      completeRedditTask();
    } else {
      toast({
        type: 'success',
        description: 'Нет проблем! Вы можете попробовать снова в любое время.',
      });
    }
  };

  const completeRedditTask = async () => {
    try {
      const response = await fetch('/api/tasks/reddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          type: 'success',
          description:
            data.message ||
            'Reddit задание выполнено! Вы получили 300 токенов.',
        });

        // Refresh task progress
        setTimeout(() => {
          loadTaskProgress();
        }, 1000);
      } else {
        toast({
          type: 'error',
          description: data.error || 'Ошибка при выполнении задания.',
        });
      }
    } catch (error) {
      console.error('Error completing Reddit task:', error);
      toast({
        type: 'error',
        description: 'Ошибка при выполнении задания. Попробуйте позже.',
      });
    }
  };

  // Показываем скелетон пока загружаемся
  if (status === 'loading' || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="font-geist font-sans bg-[#0b0b0f] min-h-screen flex flex-col text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#0b0b0f]/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              В чат
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center font-bold text-2xl text-white"
            >
              Aporto
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {!session?.user && (
              <>
                <Link
                  href="/register"
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity"
                >
                  Попробовать бесплатно
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/10"
                >
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-5xl mx-auto py-12 px-6 flex-1 w-full">
        {/* Tasks Ladder Section */}
        {session?.user ? (
          <section className="mb-16">
            <div className="rounded-3xl border border-white/10 p-8 bg-white/[0.04]">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Выполняйте задания и получайте токены.
                </h2>
                <p className="text-neutral-300 text-lg">
                  Максимум — 41,400 токенов!
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-neutral-300 text-sm">Прогресс</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 text-sm">
                      {taskProgress?.totalTokens || 0} / 41,400 токенов
                    </span>
                    <button
                      type="button"
                      onClick={loadTaskProgress}
                      className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors p-1 rounded hover:bg-white/5"
                      title="Обновить прогресс"
                    >
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${taskProgress?.progressPercentage || 0}%`,
                    }}
                  />
                </div>
                <div className="text-center mt-2 text-xs text-neutral-400">
                  {(taskProgress?.progressPercentage || 0).toFixed(1)}%
                  выполнено
                </div>
              </div>

              {/* Tasks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Email Verification Task */}
                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_email_verified
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-orange-500/30 bg-orange-500/5'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_email_verified ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2">
                      Подтвердить email
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      Подтвердите ваш email адрес
                    </p>
                    {!userData?.task_email_verified && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          resendingEmail
                            ? 'bg-neutral-600/20 text-neutral-500 border-neutral-500/30 cursor-not-allowed'
                            : 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border-orange-500/30'
                        }`}
                      >
                        {resendingEmail
                          ? 'Отправка...'
                          : 'Отправить письмо повторно'}
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_email_verified
                        ? 'text-green-400'
                        : 'text-orange-400'
                    }`}
                  >
                    +100 токенов
                  </div>
                </div>

                {/* Profile Completion Task */}
                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_profile_completed
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-orange-500/30 bg-orange-500/5'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_profile_completed ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {userData?.nickname && userData?.bio
                            ? '100'
                            : userData?.nickname || userData?.bio
                              ? '50'
                              : '0'}
                          %
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2">
                      Заполнить профиль
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      Добавьте никнейм и биографию
                    </p>
                    {!userData?.task_profile_completed && (
                      <div className="flex gap-2">
                        <Link
                          href="/profile"
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            userData?.task_profile_completed
                              ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30'
                              : 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          Профиль
                        </Link>
                      </div>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_profile_completed
                        ? 'text-green-400'
                        : 'text-orange-400'
                    }`}
                  >
                    +100 токенов
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_first_chat
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-neutral-600 bg-neutral-800/20'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_first_chat ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2">
                      Первый вопрос ИИ
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_first_chat
                        ? 'Задание выполнено!'
                        : 'Задайте свой первый вопрос'}
                    </p>
                    {!userData?.task_first_chat && (
                      <Link
                        href="/"
                        className="text-xs bg-neutral-600/20 hover:bg-neutral-600/30 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-500/30 transition-colors"
                      >
                        Новый чат
                      </Link>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_first_chat
                        ? 'text-green-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    +100 токенов
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_first_share
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-neutral-600 bg-neutral-800/20'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_first_share ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">4</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2">
                      Опубликовать чат
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_first_share
                        ? 'Задание выполнено!'
                        : 'После первого вопроса в чат нажмите &quot;Поделиться&quot;'}
                    </p>
                    {!userData?.task_first_share && (
                      <div className="text-xs text-neutral-500">
                        Или смените видимость чата на &quot;Публичный&quot;
                      </div>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_first_share
                        ? 'text-green-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    +100 токенов
                  </div>
                </div>

                {/* Social Tasks */}
                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_social_twitter
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-neutral-600 bg-neutral-800/20'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_social_twitter ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">5</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 00-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      Поделиться в Twitter
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_social_twitter
                        ? 'Задание выполнено!'
                        : 'Сделайте репост нашего поста в Twitter'}
                    </p>
                    {!userData?.task_social_twitter && (
                      <button
                        type="button"
                        onClick={handleTwitterShare}
                        className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors"
                      >
                        Поделиться
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_social_twitter
                        ? 'text-green-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    +300 токенов
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_social_facebook
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-neutral-600 bg-neutral-800/20'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_social_facebook ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">6</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Поделиться в Facebook
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_social_facebook
                        ? 'Задание выполнено!'
                        : 'Расскажите о сервисе в Facebook'}
                    </p>
                    {!userData?.task_social_facebook && (
                      <button
                        type="button"
                        className="text-xs bg-blue-700/20 hover:bg-blue-700/30 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-600/30 transition-colors"
                      >
                        Поделиться
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_social_facebook
                        ? 'text-green-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    +300 токенов
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_social_reddit
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-orange-600/30 bg-orange-600/20'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_social_reddit ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">7</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-orange-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0 1.248.561 1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                      </svg>
                      Отзыв на Reddit
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_social_reddit
                        ? 'Задание выполнено!'
                        : 'Напишите отзыв о сервисе'}
                    </p>
                    {!userData?.task_social_reddit && (
                      <button
                        type="button"
                        onClick={handleRedditShare}
                        className="text-xs bg-orange-700/20 hover:bg-orange-700/30 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-600/30 transition-colors"
                      >
                        Перейти в Reddit
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_social_reddit
                        ? 'text-green-400'
                        : 'text-orange-400'
                    }`}
                  >
                    +300 токенов
                  </div>
                </div>

                {/* Engagement Task */}
                <div
                  className={`rounded-2xl border p-6 relative ${
                    userData?.task_post_likes_10
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {userData?.task_post_likes_10 ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">8</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      10 лайков на пост
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {userData?.task_post_likes_10
                        ? 'Задание выполнено!'
                        : 'Получите 10 лайков на любой из ваших постов'}
                    </p>
                    {!userData?.task_post_likes_10 && (
                      <div className="text-xs text-neutral-500">
                        Опубликуйте интересный контент и получайте лайки
                      </div>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      userData?.task_post_likes_10
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    +300 токенов
                  </div>
                </div>

                {/* Friend Referral Tasks */}
                <div
                  className={`rounded-2xl border p-6 relative ${
                    (userData?.task_friends_invited || 0) >= 16
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-purple-500/30 bg-purple-500/5'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {(userData?.task_friends_invited || 0) >= 16 ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">9</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Пригласить друзей
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {(userData?.task_friends_invited || 0) >= 16
                        ? 'Задание выполнено! Все 16 друзей приглашены.'
                        : `Прогресс: ${userData?.task_friends_invited || 0}/16 друзей`}
                    </p>
                    {(userData?.task_friends_invited || 0) < 16 && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              referralLink || '',
                            );
                            toast({
                              type: 'success',
                              description: 'Ссылка скопирована',
                            });
                          } catch (_) {
                            console.error('Failed to copy referral link');
                          }
                        }}
                        className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
                      >
                        Скопировать ссылку
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      (userData?.task_friends_invited || 0) >= 16
                        ? 'text-green-400'
                        : 'text-purple-400'
                    }`}
                  >
                    +200 токенов за каждого
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {(userData?.task_friends_invited || 0) >= 16
                      ? `Получено: ${(userData?.task_friends_invited || 0) * 200} токенов`
                      : `Максимум: 3 200 токенов (${userData?.task_friends_invited || 0} × 200 получено)`}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-6 relative ${
                    (userData?.task_friends_pro_subscribed || 0) >= 16
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    {(userData?.task_friends_pro_subscribed || 0) >= 16 ? (
                      <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="size-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="size-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">10</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-white mb-2 flex items-center">
                      <svg
                        className="size-4 mr-2 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Друзья с ПРО подпиской
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {(userData?.task_friends_pro_subscribed || 0) >= 16
                        ? 'Задание выполнено! Все 16 друзей оформили ПРО.'
                        : `Прогресс: ${userData?.task_friends_pro_subscribed || 0}/16 друзей с ПРО`}
                    </p>
                    {(userData?.task_friends_pro_subscribed || 0) < 16 && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              referralLink || '',
                            );
                            toast({
                              type: 'success',
                              description: 'Ссылка скопирована',
                            });
                          } catch (_) {
                            console.error('Failed to copy referral link');
                          }
                        }}
                        className="text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/30 transition-colors"
                      >
                        Скопировать ссылку
                      </button>
                    )}
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      (userData?.task_friends_pro_subscribed || 0) >= 16
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    +1000 токенов за каждого
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {(userData?.task_friends_pro_subscribed || 0) >= 16
                      ? `Получено: ${(userData?.task_friends_pro_subscribed || 0) * 1000} токенов`
                      : `Максимум: 16 000 токенов (${userData?.task_friends_pro_subscribed || 0} × 1000 получено)`}
                  </div>
                </div>
              </div>

              {/* Completion Bonus */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <div
                  className={`rounded-2xl border p-8 text-center ${
                    userData?.task_all_completed
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10'
                  }`}
                >
                  <div className="mb-4">
                    <div
                      className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        userData?.task_all_completed
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                      }`}
                    >
                      {userData?.task_all_completed ? (
                        <svg
                          className="size-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="size-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Завершить все задания
                    </h3>
                    <p
                      className={`text-lg ${
                        userData?.task_all_completed
                          ? 'text-green-400 font-semibold'
                          : 'text-neutral-300'
                      }`}
                    >
                      {userData?.task_all_completed
                        ? 'Мега-бонус получен!'
                        : 'Выполните все задания и получите мега-бонус!'}
                    </p>
                  </div>
                  <div
                    className={`text-4xl font-bold ${
                      userData?.task_all_completed
                        ? 'text-green-400'
                        : 'bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent'
                    }`}
                  >
                    +10,000 токенов
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 text-center">
                <div className="text-neutral-400 text-sm mb-2">
                  Максимальная награда за все задания:
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  41,400 токенов
                </div>
                <div className="text-neutral-500 text-sm mt-1">
                  ≈ 8,280 рублей
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <footer className="mt-8 pb-4">
        <nav className="flex flex-wrap gap-6 justify-center items-center text-sm mb-2">
          <Link href="/privacy" className="text-neutral-300 hover:text-white">
            Политика конфиденциальности
          </Link>
          <Link href="/tos" className="text-neutral-300 hover:text-white">
            Пользовательское соглашение
          </Link>
          <Link
            href="/tos-subscription"
            className="text-neutral-300 hover:text-white"
          >
            Соглашение с подпиской
          </Link>
          <a
            href="mailto:hey@aporto.tech"
            className="text-neutral-300 hover:text-white"
          >
            Связаться с нами
          </a>
        </nav>
        <div className="text-center text-neutral-500 text-sm">
          {' '}
          2025@ Aporto
        </div>
      </footer>
    </div>
  );
}
