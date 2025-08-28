import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateEmailVerificationToken } from '@/lib/db/queries';
import { createWelcomeEmailTemplate } from '@/lib/email-templates';
import { createVerificationUrl } from '@/lib/email-verification';
import resend from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST EMAIL] Starting email verification test...');

    // Get current session
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[TEST EMAIL] Testing with user:', {
      id: session.user.id,
      email: session.user.email,
    });

    // Generate verification token
    const verificationToken = await generateEmailVerificationToken(
      session.user.id,
    );
    console.log('[TEST EMAIL] Generated token:', verificationToken);

    // Create verification URL
    const verificationUrl = createVerificationUrl(verificationToken);
    console.log('[TEST EMAIL] Verification URL:', verificationUrl);

    // Create email template
    const emailTemplate = createWelcomeEmailTemplate({
      userEmail: session.user.email,
      verificationToken,
    });

    console.log('[TEST EMAIL] Sending email...');

    // Send test email
    const { data, error: emailError } = await resend.emails.send({
      from: 'Aporto <noreply@aporto.tech>',
      to: [session.user.email],
      subject: 'Тест подтверждения email - Aporto',
      html: emailTemplate,
    });

    if (emailError) {
      console.error('[TEST EMAIL] Failed to send email:', emailError);
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: emailError,
          verificationUrl,
          config: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
          },
        },
        { status: 500 },
      );
    }

    console.log('[TEST EMAIL] Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      verificationUrl,
      emailId: data?.id,
      config: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      },
    });
  } catch (error) {
    console.error('[TEST EMAIL] Error in email test:', error);
    console.error('[TEST EMAIL] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : String(error),
        config: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        },
      },
      { status: 500 },
    );
  }
}
