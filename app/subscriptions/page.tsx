import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import SubscriptionsClient from './subscriptions-client';

export default async function SubscriptionsPage() {
  const session = await auth();

  // Если пользователь не авторизован, редирект на login
  if (!session || !session.user) {
    redirect('/login');
  }

  // Если у пользователя активная подписка, редирект на главную
  if (session.user.subscription_active) {
    redirect('/');
  }

  return <SubscriptionsClient />;
}
