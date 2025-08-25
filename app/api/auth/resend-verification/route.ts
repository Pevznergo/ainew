import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateEmailVerificationToken } from '@/lib/db/queries';
import { createWelcomeEmailTemplate } from '@/lib/email-templates';
import resend from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new verification token
    const verificationToken = await generateEmailVerificationToken(
      session.user.id,
    );

    // Send verification email
    const emailTemplate = createWelcomeEmailTemplate({
      userEmail: session.user.email,
      verificationToken,
    });

    const { error: emailError } = await resend.emails.send({
      from: 'Aporto <noreply@aporto.tech>',
      to: [session.user.email],
      subject: 'Подтвердите ваш email - Aporto',
      html: emailTemplate,
    });

    if (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Письмо с подтверждением отправлено на ваш email',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
