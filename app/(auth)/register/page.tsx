'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { gtmEvent } from '@/lib/gtm';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const handleSuccess = useCallback(() => {
    toast({ type: 'success', description: 'Account created successfully!' });
    setIsSuccessful(true);
    gtmEvent('sign_up', { method: 'email' });
    // Small delay to ensure session cookies are set, then refresh to update session state
    setTimeout(() => {
      window.location.href = '/subscriptions';
    }, 100);
  }, []);

  // Prefill invite code from localStorage or cookies
  useEffect(() => {
    try {
      const lsCode =
        typeof window !== 'undefined'
          ? localStorage.getItem('referralCode')
          : null;
      let cookieCode: string | null = null;
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )referralCode=([^;]+)/);
        cookieCode = match ? decodeURIComponent(match[1]) : null;
      }
      const prefill = lsCode || cookieCode || '';
      if (prefill) setInviteCode(prefill);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      handleSuccess();
    }
  }, [state.status, handleSuccess]);

  const handleSubmit = async (formData: FormData) => {
    // Получаем данные из формы
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Инвайт-код из поля формы, затем из localStorage/cookie как fallback
    const formInvite = (formData.get('inviteCode') as string) || '';
    const lsInvite =
      typeof window !== 'undefined'
        ? localStorage.getItem('referralCode')
        : null;
    let cookieInvite: string | null = null;
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )referralCode=([^;]+)/);
      cookieInvite = match ? decodeURIComponent(match[1]) : null;
    }
    const referralCode = formInvite || lsInvite || cookieInvite || '';

    console.log('Submitting registration with:', { email, referralCode });

    // Инвайт-код необязателен
    setInviteError(null);

    // Проверяем доступность инвайта только если он указан
    if (referralCode) {
      try {
        setIsCheckingInvite(true);
        const vr = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: referralCode }),
        });
        const vdata = await vr.json();
        if (!vdata?.available) {
          setInviteError('По данному коду нет доступных инвайтов');
          setIsCheckingInvite(false);
          return; // прерываем регистрацию
        }
        setIsCheckingInvite(false);
      } catch (e) {
        setIsCheckingInvite(false);
        // В случае ошибки валидации считаем код недоступным
        setInviteError('По данному коду нет доступных инвайтов');
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          referralCode,
        }),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (data.success) {
        // Очищаем реферальный код из localStorage и cookies
        if (typeof window !== 'undefined') {
          localStorage.removeItem('referralCode');
        }
        if (typeof document !== 'undefined') {
          document.cookie = 'referralCode=; path=/; max-age=0; samesite=lax';
        }
        handleSuccess();
      } else {
        toast({
          type: 'error',
          description: data.error || 'Регистрация не удалась',
        });
        if (data.error === 'invite_unavailable') {
          setInviteError('По данному коду нет доступных инвайтов');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        type: 'error',
        description: 'Регистрация не удалась',
      });
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'yandex') => {
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      toast({
        type: 'error',
        description: `Ошибка при регистрации через ${provider === 'google' ? 'Google' : 'Яндекс'}`,
      });
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Регистрация
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Создайте аккаунт с вашим email и паролем
          </p>
        </div>

        {/* OAuth кнопки */}
        <div className="px-4 sm:px-16 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
          >
            <svg className="size-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Зарегистрироваться через Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Или через email
              </span>
            </div>
          </div>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          {/* Инвайт код */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="inviteCode"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Инвайт код (необязательно)
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              className="bg-muted text-md md:text-sm rounded-md border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-800"
              type="text"
              placeholder="Введите инвайт код (необязательно)"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                if (inviteError) setInviteError(null);
              }}
            />
            {inviteError ? (
              <span className="text-sm text-red-500">{inviteError}</span>
            ) : null}
          </div>

          <SubmitButton isSuccessful={isSuccessful}>Регистрация</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Уже есть аккаунт? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Вход
            </Link>
            {' здесь.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
