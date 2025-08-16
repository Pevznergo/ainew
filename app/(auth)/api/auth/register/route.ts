import type { NextRequest } from 'next/server';
import { createUser, setUserReferrer, getInviteByCode, markInviteUsed } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Raw request body:', body);

    const { email, password, referralCode } = body;
    console.log('Parsed data:', { email, referralCode: !!referralCode });

    if (!email || !password) {
      console.log('Missing email or password');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Referral code is optional

    // If referral code provided, validate there is available invite
    if (referralCode) {
      const invite = await getInviteByCode(referralCode);
      const remaining = invite
        ? Math.max(0, (invite.available_count || 0) - (invite.used_count || 0))
        : 0;
      if (!invite || remaining <= 0) {
        return new Response(
          JSON.stringify({ error: 'invite_unavailable', message: 'По данному коду нет доступных инвайтов' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    console.log('Creating user...');
    // Создаем пользователя
    const [newUser] = (await createUser(email, password)) as any;
    console.log('User created:', newUser);

    if (!newUser) {
      console.log('Failed to create user');
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Если есть реферальный код, устанавливаем связь и списываем инвайт
    if (referralCode && newUser) {
      console.log(
        'Setting referrer for user:',
        newUser.id,
        'with code:',
        referralCode,
      );
      try {
        await setUserReferrer(newUser.id, referralCode);
        console.log('Referrer set successfully');
        try {
          await markInviteUsed(referralCode);
          console.log('Invite marked as used');
        } catch (err) {
          console.error('Failed to mark invite used:', err);
        }
      } catch (error) {
        console.error('Failed to set referrer:', error);
      }
    } else {
      console.log('No referral code or user not created', {
        referralCode,
        newUser,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User registered successfully',
        userId: newUser.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Registration error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack',
    );

    if (
      error instanceof Error &&
      error.message === 'User with this email already exists'
    ) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
