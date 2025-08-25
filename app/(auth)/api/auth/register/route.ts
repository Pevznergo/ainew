import type { NextRequest } from 'next/server';
import {
  createUser,
  setUserReferrer,
  getInviteByCode,
  markInviteUsed,
  generateEmailVerificationToken,
} from '@/lib/db/queries';
import { signIn } from '@/app/(auth)/auth';
import resend from '@/lib/resend';
import { createWelcomeEmailTemplate } from '@/lib/email-templates';

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
          JSON.stringify({
            error: 'invite_unavailable',
            message: 'По данному коду нет доступных инвайтов',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    console.log('Creating user...');
    // Создаем пользователя
    const [newUser] = (await createUser(email, password)) as any;
    console.log('User created:', newUser);

    // Generate email verification token and send welcome email
    if (newUser) {
      try {
        const verificationToken = await generateEmailVerificationToken(
          newUser.id,
        );

        // Send welcome email with verification link
        const emailTemplate = createWelcomeEmailTemplate({
          userEmail: email,
          verificationToken,
        });

        const { error: emailError } = await resend.emails.send({
          from: 'Aporto <noreply@aporto.tech>',
          to: [email],
          subject: 'Добро пожаловать в Aporto! Подтвердите ваш email',
          html: emailTemplate,
        });

        if (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail registration if email sending fails
        } else {
          console.log('Welcome email sent successfully to:', email);
        }
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
        // Don't fail registration if email sending fails
      }
    }

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

    // Автоматический вход после регистрации
    console.log('Performing automatic login...');
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      console.log('Automatic login successful');
    } catch (loginError) {
      console.error('Automatic login failed:', loginError);
      // Не прерываем процесс, так как пользователь уже создан
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
