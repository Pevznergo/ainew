import { auth } from '@/app/(auth)/auth';
import { db, getChatById, voteMessage } from '@/lib/db/queries';
import { vote } from '@/lib/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  // session may be null for guests; we still return counts

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  // Anyone authenticated can view vote state
  const [{ upvotes }] = await db
    .select({ upvotes: count(vote.messageId) })
    .from(vote)
    .where(and(eq(vote.chatId, chatId), eq(vote.isUpvoted, true)));

  let isUpvotedByMe = false;
  if (session?.user?.id) {
    const [myVote] = await db
      .select({ isUpvoted: vote.isUpvoted })
      .from(vote)
      .where(and(eq(vote.chatId, chatId), eq(vote.userId, session.user.id)))
      .limit(1);
    isUpvotedByMe = Boolean(myVote?.isUpvoted);
  }

  return Response.json(
    { upvotes: Number(upvotes) || 0, isUpvotedByMe },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:vote').toResponse();
  }

  // Any authenticated user can vote once per chat
  await voteMessage({
    chatId,
    messageId,
    userId: session.user.id,
    type: type,
  });

  return new Response('Message voted', { status: 200 });
}
