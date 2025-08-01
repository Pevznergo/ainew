import { auth } from '@/app/(auth)/auth';
import { getGuestMessageCount } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const count = await getGuestMessageCount(session.user.id);
    return Response.json({ count });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
