import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  ne,
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
  stream,
  demo, // Add this import
  invites,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import { compare } from 'bcrypt-ts';
import { ChatSDKError } from '../errors';
import {
  TASK_REWARDS,
  TaskType,
  generateEmailVerificationToken as generateTokenString,
  getEmailVerificationExpiry,
} from '../email-verification';

// A lightweight chat shape that excludes optional/new columns like `hashtags`.
type ChatBasic = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: string;
};

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

// ===================== INVITES =====================
// Create or return invite entry using user's existing referral_code
export async function createInvite(ownerUserId: string, availableCount = 4) {
  try {
    // ensure user has referral_code
    const referralCode = await getUserReferralCode(ownerUserId);

    // if invite already exists for this owner, return it
    const existing = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.owner_user_id, ownerUserId),
          eq(invites.code, referralCode),
        ),
      )
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

    // Сначала создаем пользователя без nickname
    const result = await db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
      } as any)
      .returning({
        id: user.id,
        email: user.email,
        nickname: user.nickname as any,
      });

    // Затем обновляем nickname используя сгенерированный ID
    if (result[0]) {
      const nickname = `user-${result[0].id.slice(0, 9)}`;
      const updatedResult = await db
        .update(user)
        .set({ nickname } as any)
        .where(eq(user.id, result[0].id))
        .returning({
          id: user.id,
          email: user.email,
          nickname: user.nickname as any,
        });

      console.log('User created successfully:', updatedResult[0]);
      return updatedResult;
    }

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
    // Сначала создаем пользователя без nickname
    const result = await db
      .insert(user)
      .values({
        email,
        password,
      } as any)
      .returning({
        id: user.id,
        email: user.email,
        nickname: user.nickname as any,
      });

    // Обновляем nickname используя сгенерированный ID
    if (result[0]) {
      const nickname = `user-${result[0].id.slice(0, 9)}`;
      const updatedResult = await db
        .update(user)
        .set({ nickname } as any)
        .where(eq(user.id, result[0].id))
        .returning({
          id: user.id,
          email: user.email,
          nickname: user.nickname as any,
        });
      return updatedResult;
    }

    return result;
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
        nickname: email,
      } as any)
      .returning({
        id: user.id,
        email: user.email,
        nickname: user.nickname as any,
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
    .returning({
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      createdAt: chat.createdAt,
      visibility: chat.visibility,
    });

  console.log('saveChat result:', result);

  // Check for first chat completion and award tokens if appropriate
  // This is performance-optimized: only checks if user hasn't completed the task yet
  try {
    await checkFirstChat(userId);
  } catch (error) {
    console.error('Error checking first chat completion:', error);
    // Don't fail the chat save if task checking fails
  }

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
        .select({
          id: chat.id,
          createdAt: chat.createdAt,
          title: chat.title,
          userId: chat.userId,
          visibility: chat.visibility,
        })
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<ChatBasic> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select({ id: chat.id, createdAt: chat.createdAt })
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError('not_found:database');
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select({ id: chat.id, createdAt: chat.createdAt })
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
    } as { chats: ChatBasic[]; hasMore: boolean };
  } catch (error) {
    console.error('getChatsByUserId error:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
        userId: chat.userId,
        visibility: chat.visibility,
        hashtags: chat.hashtags as any,
      })
      .from(chat)
      .where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function setChatHashtags({
  chatId,
  hashtags,
}: {
  chatId: string;
  hashtags: string[];
}) {
  try {
    // Helper: transliterate Cyrillic (ru) to Latin and slugify to ASCII
    const translitMap: Record<string, string> = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ё: 'e',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'h',
      ц: 'c',
      ч: 'ch',
      ш: 'sh',
      щ: 'sch',
      ъ: '',
      ы: 'y',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya',
    };
    // Best-effort translator to English using DeepL if available; fallback to a small RU->EN dictionary
    const translateToEnglish = async (inputs: string[]): Promise<string[]> => {
      const key = process.env.DEEPL_API_KEY;
      const normalizedInputs = (inputs || []).map((s) =>
        String(s || '').trim(),
      );
      if (normalizedInputs.length === 0) return normalizedInputs;

      // If DeepL key is available, try using it first
      if (key) {
        try {
          const form = new URLSearchParams();
          for (const t of normalizedInputs) form.append('text', t);
          form.append('target_lang', 'EN');
          const res = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
              Authorization: `DeepL-Auth-Key ${key}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: form.toString(),
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            const translated = Array.isArray(data?.translations)
              ? data.translations.map((t: any) => String(t?.text || ''))
              : normalizedInputs;
            return translated;
          }
        } catch {
          // fall through to dictionary
        }
      }

      // Fallback: small RU->EN dictionary for common tags
      const dict: Record<string, string> = {
        дом: 'home',
        квартира: 'apartment',
        ремонт: 'renovation',
        кухня: 'kitchen',
        работа: 'work',
        учеба: 'study',
        обучение: 'education',
        школа: 'school',
        университет: 'university',
        новости: 'news',
        кино: 'movies',
        фильм: 'movie',
        музыка: 'music',
        авто: 'cars',
        машина: 'car',
        спорт: 'sport',
        здоровье: 'health',
        еда: 'food',
        рецепт: 'recipe',
        путешествия: 'travel',
        поездка: 'trip',
        технологии: 'tech',
        техника: 'electronics',
        наука: 'science',
        искусство: 'art',
        фото: 'photo',
        видео: 'video',
        разработка: 'development',
        программирование: 'programming',
        код: 'code',
        дизайн: 'design',
        бизнес: 'business',
        деньги: 'money',
        финансы: 'finance',
        природа: 'nature',
        животные: 'animals',
        семья: 'family',
        друзья: 'friends',
        игра: 'game',
        игры: 'games',
        погода: 'weather',
        политика: 'politics',
        юмор: 'humor',
        маркетинг: 'marketing',
        аналитика: 'analytics',
        данные: 'data',
        интернет: 'internet',
        безопасность: 'security',
      };
      const cyrillicRe = /[\u0400-\u04FF]/;
      const mapWord = (w: string) => {
        const lw = w.toLowerCase();
        return dict[lw] || w;
      };
      return normalizedInputs.map((s) => {
        if (!cyrillicRe.test(s)) return s; // not Cyrillic, leave as is
        // split by space or hyphen and map tokens if present in dict
        const tokens = s.split(/[\s-]+/g);
        const mapped = tokens.map(mapWord).join(' ');
        return mapped;
      });
    };
    const toEnglishSlug = (input: string) => {
      const lower = String(input || '')
        .trim()
        .toLowerCase();
      // Cyrillic transliteration
      const transliterated = lower
        .split('')
        .map((ch) => (translitMap[ch] !== undefined ? translitMap[ch] : ch))
        .join('');
      // Remove diacritics and non-ASCII, keep letters, numbers and '-'
      const ascii = transliterated
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      const trimmed = ascii.length > 64 ? ascii.slice(0, 64) : ascii;
      return trimmed;
    };

    // If possible, translate tags to English first, then slugify
    const translated = await translateToEnglish(hashtags || []);
    // Normalize: english text -> slug -> unique, non-empty
    const normalized = Array.from(
      new Set(
        (translated || [])
          .map((t) => toEnglishSlug(t))
          .filter((t) => t.length > 0),
      ),
    );

    await db
      .update(chat)
      .set({ hashtags: normalized as any } as any)
      .where(eq(chat.id, chatId));

    return true;
  } catch (err) {
    // If column is missing or any other issue occurs, log and continue silently
    console.warn('setChatHashtags failed:', err);
    return false;
  }
}

export async function getFirstUserMessageByChatId({
  chatId,
}: {
  chatId: string;
}) {
  try {
    const msgs = await db
      .select()
      .from(message)
      .where(and(eq(message.chatId, chatId), eq(message.role, 'user')))
      .orderBy(asc(message.createdAt))
      .limit(1);
    return msgs[0];
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

export async function getUserNickname(userId: string) {
  const [foundUser] = await db
    .select({ nickname: user.nickname })
    .from(user)
    .where(eq(user.id, userId));
  return foundUser?.nickname || null;
}

export async function updateUserNickname(userId: string, nickname: string) {
  const value = String(nickname || '').trim();
  if (!value) throw new ChatSDKError('bad_request:nickname_empty');
  if (value.length > 64)
    throw new ChatSDKError('bad_request:nickname_too_long');
  // Disallow uppercase letters
  if (value !== value.toLowerCase()) {
    throw new ChatSDKError('bad_request:nickname_uppercase');
  }
  // If unchanged, return early
  const [current] = await db
    .select({ id: user.id, nickname: user.nickname as any })
    .from(user)
    .where(eq(user.id, userId));
  if (current && String(current.nickname || '') === value) {
    return current;
  }
  // Check if nickname already used by another user
  const [exists] = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(eq(user.nickname as any, value as any), ne(user.id, userId)) as any,
    );
  if (exists) {
    throw new ChatSDKError('conflict:nickname_taken');
  }

  // Proceed to update
  const [updated] = await db
    .update(user)
    .set({ nickname: value } as any)
    .where(eq(user.id, userId))
    .returning({ id: user.id, nickname: user.nickname as any });
  return updated;
}

export async function getUserBio(userId: string) {
  const [foundUser] = await db
    .select({ bio: user.bio })
    .from(user)
    .where(eq(user.id, userId));
  return foundUser?.bio || '';
}

export async function updateUserBio(userId: string, bio: string) {
  const value = String(bio ?? '');
  // Optional: enforce max length (200 chars)
  if (value.length > 200) {
    throw new ChatSDKError('bad_request:bio_too_long');
  }
  const [updated] = await db
    .update(user)
    .set({ bio: value } as any)
    .where(eq(user.id, userId))
    .returning({ id: user.id, bio: user.bio as any });
  return updated;
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const curr = String(currentPassword || '');
  const next = String(newPassword || '');
  if (!next || next.length < 8) {
    throw new ChatSDKError('bad_request:password_too_short');
  }
  // Load user
  const [u] = await db
    .select({ id: user.id, password: user.password })
    .from(user)
    .where(eq(user.id, userId));
  if (!u) throw new ChatSDKError('not_found:database');

  // If user has password, verify current
  if (u.password) {
    const matches = await compare(curr, u.password as any);
    if (!matches) throw new ChatSDKError('forbidden:wrong_password');
  } else {
    // If no password set (OAuth account), require current to be empty
    if (curr) throw new ChatSDKError('forbidden:wrong_password');
  }

  const hashed = generateHashedPassword(next);
  const [updated] = await db
    .update(user)
    .set({ password: hashed } as any)
    .where(eq(user.id, userId))
    .returning({ id: user.id });
  return updated;
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
      } as any)
      .returning();

    // Обновляем nickname используя сгенерированный ID
    if (result[0]) {
      const nickname = `user-${result[0].id.slice(0, 9)}`;
      const updatedUser = await db
        .update(user)
        .set({ nickname } as any)
        .where(eq(user.id, result[0].id))
        .returning();

      console.log('OAuth user created successfully:', updatedUser[0]);
      return updatedUser[0];
    }

    console.log('OAuth user created successfully:', result);
    return result[0];
  } catch (error) {
    console.error('Error creating OAuth user:', error);
    throw new ChatSDKError('bad_request:database');
  }
}

// ===================== EMAIL VERIFICATION =====================

export async function generateEmailVerificationToken(
  userId: string,
): Promise<string> {
  try {
    const token = generateTokenString();
    const expires = getEmailVerificationExpiry();

    await db
      .update(user)
      .set({
        email_verification_token: token,
        email_verification_expires: expires,
      } as any)
      .where(eq(user.id, userId));

    return token;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function verifyEmailToken(token: string): Promise<User | null> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.email_verification_token, token),
          gt(user.email_verification_expires, new Date()),
        ),
      )
      .limit(1);

    if (!foundUser) {
      return null;
    }

    // Mark email as verified and complete the task
    const [updatedUser] = await db
      .update(user)
      .set({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        task_email_verified: true,
        task_email_verified_at: new Date(),
        task_tokens_earned:
          (foundUser.task_tokens_earned || 0) + TASK_REWARDS.EMAIL_VERIFICATION,
        balance: (foundUser.balance || 0) + TASK_REWARDS.EMAIL_VERIFICATION,
      } as any)
      .where(eq(user.id, foundUser.id))
      .returning();

    return updatedUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function getUserTaskProgress(userId: string) {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return foundUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function completeTask(
  userId: string,
  taskType: TaskType,
  additionalData?: any,
): Promise<User | null> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!foundUser) {
      return null;
    }

    const updates: any = {};
    const now = new Date();
    let tokensToAdd = 0;

    switch (taskType) {
      case 'EMAIL_VERIFICATION':
        if (!foundUser.task_email_verified) {
          updates.task_email_verified = true;
          updates.task_email_verified_at = now;
          tokensToAdd = TASK_REWARDS.EMAIL_VERIFICATION;
        }
        break;
      case 'PROFILE_COMPLETION':
        if (!foundUser.task_profile_completed) {
          updates.task_profile_completed = true;
          updates.task_profile_completed_at = now;
          tokensToAdd = TASK_REWARDS.PROFILE_COMPLETION;
        }
        break;
      case 'FIRST_CHAT':
        if (!foundUser.task_first_chat) {
          updates.task_first_chat = true;
          updates.task_first_chat_at = now;
          tokensToAdd = TASK_REWARDS.FIRST_CHAT;
        }
        break;
      case 'FIRST_SHARE':
        if (!foundUser.task_first_share) {
          updates.task_first_share = true;
          updates.task_first_share_at = now;
          tokensToAdd = TASK_REWARDS.FIRST_SHARE;
        }
        break;
      case 'SOCIAL_TWITTER':
        if (!foundUser.task_social_twitter) {
          updates.task_social_twitter = true;
          tokensToAdd = TASK_REWARDS.SOCIAL_TWITTER;
        }
        break;
      case 'SOCIAL_FACEBOOK':
        if (!foundUser.task_social_facebook) {
          updates.task_social_facebook = true;
          tokensToAdd = TASK_REWARDS.SOCIAL_FACEBOOK;
        }
        break;
      case 'SOCIAL_VK':
        if (!foundUser.task_social_vk) {
          updates.task_social_vk = true;
          tokensToAdd = TASK_REWARDS.SOCIAL_VK;
        }
        break;
      case 'SOCIAL_TELEGRAM':
        if (!foundUser.task_social_telegram) {
          updates.task_social_telegram = true;
          tokensToAdd = TASK_REWARDS.SOCIAL_TELEGRAM;
        }
        break;
      case 'FRIEND_INVITATION':
        updates.task_friends_invited =
          (foundUser.task_friends_invited || 0) + 1;
        tokensToAdd = TASK_REWARDS.FRIEND_INVITATION;
        break;
    }

    if (Object.keys(updates).length > 0) {
      updates.task_tokens_earned =
        (foundUser.task_tokens_earned || 0) + tokensToAdd;
      updates.balance = (foundUser.balance || 0) + tokensToAdd;

      const [updatedUser] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, userId))
        .returning();

      return updatedUser;
    }

    return foundUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database');
  }
}

export async function checkProfileCompletion(userId: string): Promise<void> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!foundUser || foundUser.task_profile_completed) {
      return;
    }

    // Check if profile is completed (has nickname and bio)
    if (foundUser.nickname && foundUser.bio) {
      await completeTask(userId, 'PROFILE_COMPLETION');
    }
  } catch (error) {
    console.error('Error checking profile completion:', error);
  }
}

export async function checkFirstChat(userId: string): Promise<void> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Only check if user hasn't completed first chat task yet - performance optimization
    if (!foundUser || foundUser.task_first_chat) {
      return;
    }

    // User hasn't completed first chat task, so complete it now
    await completeTask(userId, 'FIRST_CHAT');
  } catch (error) {
    console.error('Error checking first chat completion:', error);
  }
}
