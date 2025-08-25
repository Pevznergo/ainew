import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  console.log('=== GET /api/history called ===');

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '20');
    const startingAfter = searchParams.get('startingAfter');
    const endingBefore = searchParams.get('endingBefore');

    console.log('History API params:', { limit, startingAfter, endingBefore });

    console.log('About to call auth()...');
    const session = await auth();
    console.log('Auth result:', session);
    console.log('Session user:', session?.user);
    console.log('Session expires:', session?.expires);

    if (!session?.user) {
      console.log('No session, returning 401');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    console.log('About to call getChatsByUserId with:', {
      id: session.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    const chats = await getChatsByUserId({
      id: session.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    console.log('getChatsByUserId result:', chats);
    return Response.json(chats);
  } catch (error) {
    console.error('History API error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack',
    );
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
