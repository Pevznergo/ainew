import { type NextRequest, NextResponse } from 'next/server';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { auth } from '@/app/(auth)/auth';

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID || '',
  secretKey: process.env.YOOKASSA_SECRET_KEY || '',
});

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  try {
    if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 },
      );
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consents } = await request.json();

    // Проверяем, что все согласия получены
    const requiredConsents = ['offer', 'personal', 'recurring', 'privacy'];
    const allConsentsGiven = requiredConsents.every(
      (consent) => consents[consent],
    );

    if (!allConsentsGiven) {
      return NextResponse.json(
        { error: 'All consents required' },
        { status: 400 },
      );
    }

    // Создаем платеж в YooKassa
    const payment = await checkout.createPayment({
      amount: {
        value: '199.00',
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://aporto.tech/profile?payment=success',
      },
      capture: true,
      description: 'Подписка Aporto PRO - 1 месяц',
      metadata: {
        user_id: session.user.id,
        subscription_type: 'pro_monthly',
        consents: JSON.stringify(consents),
      },
      receipt: {
        customer: {
          email: session.user.email,
        },
        items: [
          {
            description: 'Подписка Aporto PRO',
            quantity: '1.00',
            amount: {
              value: '199.00',
              currency: 'RUB',
            },
            vat_code: 1, // НДС не облагается
          },
        ],
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Payment creation failed' },
      { status: 500 },
    );
  }
}
