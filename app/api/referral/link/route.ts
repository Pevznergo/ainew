import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserReferralCode } from '@/lib/db/queries';

export async function GET() {
  try {
    console.log('Getting referral link...');
    
    const session = await auth();
    console.log('Session:', session?.user?.id);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting referral code for user:', session.user.id);
    const referralCode = await getUserReferralCode(session.user.id);
    console.log('Generated referral code:', referralCode);
    
    const referralLink = `${process.env.NEXTAUTH_URL}/api/auth/guest?ref=${referralCode}`;
    console.log('Generated referral link:', referralLink);

    return NextResponse.json({ 
      referralCode,
      referralLink 
    });
  } catch (error) {
    console.error('Failed to get referral link:', error);
    return NextResponse.json(
      { error: 'Failed to get referral link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 