import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { YooCheckout } from '@a2seven/yoo-checkout';
import {
  db,
  payReferralBonus,
  checkFriendProSubscription,
} from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
  throw new Error('YooKassa credentials are required');
}

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // Проверяем подпись (рекомендуется для production)
    // const signature = request.headers.get('authorization');

    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const userId = payment.metadata?.user_id;
      const paymentType = payment.metadata?.payment_type;

      if (userId) {
        // Получаем текущий баланс пользователя
        const [currentUser] = await db
          .select({ balance: user.balance })
          .from(user)
          .where(eq(user.id, userId));

        if (paymentType === 'coins_purchase') {
          // Покупка токенов
          const coinsAmount = Number.parseInt(
            payment.metadata?.coins_amount || '0',
          );

          await db
            .update(user)
            .set({
              balance: sql`${user.balance} + ${coinsAmount}`,
            } as any)
            .where(eq(user.id, userId));

          console.log(`Added ${coinsAmount} coins to user ${userId}`);
        } else {
          // PRO подписка (существующая логика)
          await db
            .update(user)
            .set({
              subscription_active: true,
              subscription_expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ),
              balance: sql`${user.balance} + 1000`,
            } as any)
            .where(eq(user.id, userId));

          // Начисляем реферальный бонус
          await payReferralBonus(userId);

          // Check for friend PRO subscription reward - award tokens to referrer if this user was referred
          try {
            await checkFriendProSubscription(userId);
          } catch (error) {
            console.error(
              'Error processing friend PRO subscription reward:',
              error,
            );
            // Don't fail the subscription activation if friend reward check fails
          }

          console.log(`PRO subscription activated for user ${userId}`);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
