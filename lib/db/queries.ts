import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  model,
  user,
  referrals,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type Chat,
  stream,
  demo, // Add this import
  invites,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

// ===================== INVITES =====================
// Create or return invite entry using user's existing referral_code
export async function createInvite(
  ownerUserId: string,
  availableCount = 4,
) {
  try {
    // ensure user has referral_code
    const referralCode = await getUserReferralCode(ownerUserId);

    // if invite already exists for this owner, return it
    const existing = await db
      .select()
      .from(invites)
      .where(and(eq(invites.owner_user_id, ownerUserId), eq(invites.code, referralCode)))
      .limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db
      .insert(invites)
      .values({
        code: referralCode,
        owner_user_id: ownerUserId,
        available_count: availableCount,
        used_count: 0,
      } as any)
      .returning({
        id: invites.id,
        code: invites.code,
        available_count: invites.available_count,
        used_count: invites.used_count,
        created_at: invites.created_at,
      });
    return created;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function listInvitesByOwner(ownerUserId: string) {
  try {
    return await db
      .select()
      .from(invites)
      .where(eq(invites.owner_user_id, ownerUserId))
      .orderBy(desc(invites.created_at));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getInviteByCode(code: string) {
  try {
    const [inv] = await db
      .select()
      .from(invites)
      .where(eq(invites.code, code))
      .limit(1);
    return inv;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function markInviteUsed(code: string) {
  try {
    const inv = await getInviteByCode(code);
    if (!inv) return null;
    if ((inv.used_count || 0) >= (inv.available_count || 0)) {
      return inv; // no change if exhausted
    }
    const [updated] = await db
      .update(invites)
      .set({ used_count: (inv.used_count || 0) + 1 } as any)
      .where(eq(invites.code, code))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const result = await db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
      })
      .returning({
        id: user.id,
        email: user.email,
      });

    console.log('User created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    if (
      error instanceof Error &&
      error.message === 'User with this email already exists'
    ) {
      throw error;
    }
    throw new ChatSDKError('bad_request:database');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function createGuestUserWithReferral(referralCode?: string) {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const [newUser] = await db
      .insert(user)
      .values({
        email,
        password,
      })
      .returning({
        id: user.id,
        email: user.email,
      });

    // Если есть реферальный код, устанавливаем связь
    if (referralCode && newUser) {
      await setUserReferrer(newUser.id, referralCode);
    }

    return [newUser];
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility?: 'private' | 'public';
}) {
  console.log('saveChat called with id:', id);

  const result = await db
    .insert(chat)
    .values({
      id,
      userId,
      title,
      createdAt: new Date(),
      ...(visibility ? { visibility } : {}),
    } as any)
    .returning();

  console.log('saveChat result:', result);
  return result[0];
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    console.log('getChatsByUserId called with:', {
      id,
      limit,
      startingAfter,
      endingBefore,
    });

    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError('not_found:database');
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError('not_found:database');
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('getChatsByUserId error:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getUserSubscriptionStatus(userId: string) {
  const [foundUser] = await db
    .select({ subscription_active: user.subscription_active })
    .from(user)
    .where(eq(user.id, userId));
  return foundUser; // { subscription_active: false } или undefined
}

export async function getUserBalance(userId: string) {
  const [foundUser] = await db
    .select({ balance: user.balance })
    .from(user)
    .where(eq(user.id, userId));
  return foundUser; // { balance: number } или undefined
}

export async function decrementUserBalance(userId: string, amount: number) {
  // Получаем текущий баланс
  const [foundUser] = await db.select().from(user).where(eq(user.id, userId));
  if (!foundUser) throw new Error('User not found');
  const newBalance = foundUser.balance - amount;
  if (newBalance < 0) throw new Error('Insufficient balance');

  // Обновляем баланс
  await db
    .update(user)
    .set({ balance: newBalance } as any)
    .where(eq(user.id, userId));
  return newBalance;
}

export async function getModelByName(name: string) {
  const [foundModel] = await db
    .select()
    .from(model)
    .where(eq(model.name, name));
  return foundModel;
}

export async function getUserById(id: string) {
  const [foundUser] = await db.select().from(user).where(eq(user.id, id));
  return foundUser;
}

export async function saveMessages({
  messages,
}: {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    parts: Array<{
      type: 'text' | 'image';
      text?: string;
      imageUrl?: string;
    }>;
    createdAt?: Date | string | number;
    attachments: Array<{
      type: 'image' | 'file';
      url: string;
      name: string;
    }>;
    chatId: string;
  }>;
}) {
  try {
    console.log('Saving messages:', messages.length);

    const messagesToInsert = messages.map((message) => {
      const raw = (message as any).createdAt;
      let createdAt: Date | undefined;
      if (raw instanceof Date) createdAt = raw;
      else if (typeof raw === 'string' || typeof raw === 'number') {
        const d = new Date(raw);
        createdAt = Number.isNaN(d.getTime()) ? new Date() : d;
      } else {
        createdAt = new Date();
      }

      return {
        id: message.id,
        role: message.role,
        parts: message.parts,
        createdAt,
        attachments: message.attachments,
        chatId: message.chatId,
      };
    });

    console.log('Messages to insert:', messagesToInsert);

    // Используем ON CONFLICT DO NOTHING для игнорирования дубликатов
    const result = await db
      .insert(message)
      .values(messagesToInsert)
      .onConflictDoNothing();

    console.log('Messages saved successfully:', result);

    return result;
  } catch (error) {
    console.error('Error saving messages:', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function voteMessage({
  chatId,
  messageId,
  userId,
  type,
}: {
  chatId: string;
  messageId: string;
  userId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.chatId, chatId), eq(vote.userId, userId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' } as any)
        .where(and(eq(vote.chatId, chatId), eq(vote.userId, userId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      userId,
      isUpvoted: type === 'up',
    } as any);
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        title,
        kind,
        content,
        userId,
      } as any)
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db.delete(suggestion).where(and(eq(suggestion.documentId, id)));

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const updated = await db
      .update(chat)
      .set({ visibility } as any)
      .where(eq(chat.id, chatId))
      .returning({ id: chat.id, visibility: chat.visibility });
    if (!updated || updated.length === 0) {
      throw new ChatSDKError('not_found:chat');
    }
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db.insert(stream).values({ id: streamId, chatId } as any);
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

// Генерация уникального реферального кода
export async function generateReferralCode(): Promise<string> {
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.referral_code, code));

    if (!existingUser) {
      isUnique = true;
      return code;
    }
  }
  throw new Error('Failed to generate unique referral code');
}

// Получение или создание реферального кода пользователя
export async function getUserReferralCode(userId: string): Promise<string> {
  try {
    const [foundUser] = await db
      .select({ referral_code: user.referral_code })
      .from(user)
      .where(eq(user.id, userId));

    if (!foundUser?.referral_code) {
      // Если нет кода, создаем новый
      const referralCode = await generateReferralCode();

      await db
        .update(user)
        .set({ referral_code: referralCode } as any)
        .where(eq(user.id, userId));

      return referralCode;
    }

    return foundUser.referral_code;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

// Получение пользователя по реферальному коду
export async function getUserByReferralCode(code: string) {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.referral_code, code));

    return foundUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

// Установка реферера для пользователя
export async function setUserReferrer(
  userId: string,
  referralCode: string,
): Promise<void> {
  try {
    const referrer = await getUserByReferralCode(referralCode);
    if (!referrer) return;

    // Обновляем пользователя
    await db
      .update(user)
      .set({ referred_by: referrer.id } as any)
      .where(eq(user.id, userId));

    // Создаем запись в таблице рефералов
    await db.insert(referrals).values({
      referrer_id: referrer.id,
      referred_id: userId,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

// Начисление реферального бонуса
export async function payReferralBonus(referredUserId: string): Promise<void> {
  try {
    // Получаем информацию о реферале
    const [referredUser] = await db
      .select({
        referred_by: user.referred_by,
        referral_bonus_paid: user.referral_bonus_paid,
      })
      .from(user)
      .where(eq(user.id, referredUserId));

    if (!referredUser?.referred_by || referredUser.referral_bonus_paid) {
      return; // Нет реферера или бонус уже выплачен
    }

    // Получаем текущий баланс реферера
    const [referrer] = await db
      .select({ balance: user.balance })
      .from(user)
      .where(eq(user.id, referredUser.referred_by));

    if (referrer) {
      // Начисляем 1000 токенов рефереру
      await db
        .update(user)
        .set({ balance: (referrer.balance || 0) + 1000 } as any)
        .where(eq(user.id, referredUser.referred_by));

      // Отмечаем, что бонус выплачен
      await db
        .update(user)
        .set({ referral_bonus_paid: true } as any)
        .where(eq(user.id, referredUserId));

      // Обновляем таблицу рефералов
      await db
        .update(referrals)
        .set({
          bonus_paid: true,
          bonus_paid_at: new Date(),
        } as any)
        .where(eq(referrals.referred_id, referredUserId));

      console.log(
        `Referral bonus paid: 1000 coins to user ${referredUser.referred_by} for referring ${referredUserId}`,
      );
    }
  } catch (error) {
    console.error('Failed to pay referral bonus:', error);
  }
}

export async function getGuestMessageCount(userId: string): Promise<number> {
  console.log('getGuestMessageCount called with userId:', userId);

  const result = await db
    .select({ messageCount: count(message.id) })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(eq(chat.userId, userId));

  console.log('getGuestMessageCount result:', result);
  const messageCount = result[0]?.messageCount || 0;
  console.log('Final count:', messageCount);

  return messageCount;
}

export async function getDemoByName(name: string) {
  const result = await db
    .select()
    .from(demo)
    .where(eq(demo.name, name))
    .limit(1);

  return result[0] || null;
}

export async function createDemo(data: {
  name: string;
  logo_name: string;
  logo_url?: string;
  background_color?: string;
}) {
  const result = await db.insert(demo).values(data).returning();

  return result[0];
}

export async function createOAuthUser(userData: {
  email: string;
  name?: string;
  type?: string;
  subscription_active?: boolean;
  balance?: number;
}) {
  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existingUsers.length > 0) {
      // Пользователь уже существует, возвращаем его
      return existingUsers[0];
    }

    // Создаем нового пользователя
    const result = await db
      .insert(user)
      .values({
        email: userData.email,
        password: generateHashedPassword(generateUUID()), // Генерируем случайный пароль
      })
      .returning();

    console.log('OAuth user created successfully:', result);
    return result[0];
  } catch (error) {
    console.error('Error creating OAuth user:', error);
    throw new ChatSDKError('bad_request:database');
  }
}
