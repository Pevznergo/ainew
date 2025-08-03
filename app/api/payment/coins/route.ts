import { type NextRequest, NextResponse } from 'next/server';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { auth } from '@/app/(auth)/auth';

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID || '',
  secretKey: process.env.YOOKASSA_SECRET_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      console.log('Missing YooKassa credentials');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 },
      );
    }

    console.log('Environment check passed');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    const session = await auth();
    if (!session?.user?.email) {
      console.log('No session or user email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.email);

    const { packageData } = await request.json();
    console.log('Package data received:', packageData);

    // Валидация пакета
    const validPackages = [
      {
        label: '250 токенов — 150 ₽',
        price: 150,
        coins: 250,
        pricePer: '0,60',
      },
      {
        label: '800 токенов — 300 ₽',
        price: 300,
        coins: 800,
        pricePer: '0,38',
      },
      {
        label: '1500 токенов — 500 ₽',
        price: 500,
        coins: 1500,
        pricePer: '0,33',
      },
      {
        label: '4000 токенов — 1500 ₽',
        price: 1500,
        coins: 4000,
        pricePer: '0,38',
      },
      {
        label: '15000 токенов — 3000 ₽',
        price: 3000,
        coins: 15000,
        pricePer: '0,20',
      },
    ];

    const selectedPackage = validPackages.find(
      (pkg) =>
        pkg.coins === packageData.coins && pkg.price === packageData.price,
    );

    console.log('Selected package:', selectedPackage);

    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Создаем платеж в YooKassa
    console.log('Creating YooKassa payment...');
    const payment = await checkout.createPayment({
      amount: {
        value: selectedPackage.price.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.NEXTAUTH_URL}/profile?payment=coins_success`,
      },
      capture: true,
      description: `Покупка ${selectedPackage.coins} токенов Aporto`,
      metadata: {
        user_id: session.user.id,
        payment_type: 'coins_purchase',
        coins_amount: selectedPackage.coins.toString(),
        package_label: selectedPackage.label,
      },
      receipt: {
        customer: {
          email: session.user.email,
        },
        items: [
          {
            description: `Токены Aporto (${selectedPackage.coins} шт.)`,
            quantity: '1.00',
            amount: {
              value: selectedPackage.price.toFixed(2),
              currency: 'RUB',
            },
            vat_code: 1, // НДС не облагается
          },
        ],
      },
    });

    console.log('Payment created successfully:', payment.id);
    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    });
  } catch (error) {
    console.error('Detailed payment error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    return NextResponse.json(
      { error: 'Payment creation failed' },
      { status: 500 },
    );
  }
}
