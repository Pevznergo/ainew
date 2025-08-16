import { auth } from '@/app/(auth)/auth';
import { getUserReferralCode } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const referralCode = await getUserReferralCode(session.user.id);
  // Исправляем ссылку - она должна вести на /main с реферальным кодом
  const referralLink = `https://aporto.tech/main?ref=${referralCode}`;

  return Response.json({ referralLink });
}
