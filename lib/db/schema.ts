import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  text,
  primaryKey,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { generateUUID } from '../utils';

export const user = pgTable('User', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  nickname: text('nickname').unique(),
  bio: text('bio'),
  balance: integer('balance').notNull().default(0),
  referral_code: text('referral_code'),
  referred_by: text('referred_by'),
  referral_bonus_paid: boolean('referral_bonus_paid').default(false),
  subscription_active: boolean('subscription_active').default(false),
  type: text('type').notNull().default('guest'),

  // Email verification
  email_verified: boolean('email_verified').default(false),
  email_verification_token: text('email_verification_token'),
  email_verification_expires: timestamp('email_verification_expires'),

  // Task completion tracking
  task_email_verified: boolean('task_email_verified').default(false),
  task_profile_completed: boolean('task_profile_completed').default(false),
  task_first_chat: boolean('task_first_chat').default(false),
  task_first_share: boolean('task_first_share').default(false),
  task_social_twitter: boolean('task_social_twitter').default(false),
  task_social_facebook: boolean('task_social_facebook').default(false),
  task_social_vk: boolean('task_social_vk').default(false),
  task_social_telegram: boolean('task_social_telegram').default(false),
  task_social_reddit: boolean('task_social_reddit').default(false),
  task_friends_invited: integer('task_friends_invited').default(0),
  task_friends_pro_subscribed: integer('task_friends_pro_subscribed').default(
    0,
  ),
  task_post_likes_10: boolean('task_post_likes_10').default(false),
  task_all_completed: boolean('task_all_completed').default(false),

  // Task completion timestamps
  task_email_verified_at: timestamp('task_email_verified_at'),
  task_profile_completed_at: timestamp('task_profile_completed_at'),
  task_first_chat_at: timestamp('task_first_chat_at'),
  task_first_share_at: timestamp('task_first_share_at'),

  // Total tokens earned from tasks
  task_tokens_earned: integer('task_tokens_earned').default(0),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: text('id').primaryKey(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  title: text('title').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  visibility: text('visibility').notNull().default('public'),
  hashtags: varchar('hashtags', { length: 64 }).array(),
  isRepost: boolean('is_repost').notNull().default(false),
  originalChatId: text('original_chat_id').references(() => chat.id, {
    onDelete: 'set null',
  }),
  originalAuthorId: text('original_author_id').references(() => user.id, {
    onDelete: 'set null',
  }),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message_v2', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id),
  role: text('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: text('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: text('messageId')
      .notNull()
      .references(() => message.id),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.userId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable('Document', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  title: text('title').notNull(),
  content: text('content'),
  kind: text('kind').notNull().default('text'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
});

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable('Suggestion', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  documentId: text('documentId')
    .notNull()
    .references(() => document.id),
  originalText: text('originalText').notNull(),
  suggestedText: text('suggestedText').notNull(),
  description: text('description'),
  isResolved: boolean('isResolved').notNull().default(false),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable('Stream', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Stream = InferSelectModel<typeof stream>;

export const model = pgTable('models', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  name: varchar('name', { length: 64 }).notNull(),
  cost: integer('cost').notNull(),
});

export type Model = InferSelectModel<typeof model>;

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id),
  yookassa_payment_id: text('yookassa_payment_id').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull(),
  subscription_type: text('subscription_type'),
  created_at: timestamp('created_at').defaultNow(),
});

export type Payment = InferSelectModel<typeof payments>;

export const referrals = pgTable('referrals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  referrer_id: text('referrer_id').notNull(),
  referred_id: text('referred_id').notNull(),
  bonus_paid: boolean('bonus_paid').notNull().default(false),
  bonus_paid_at: timestamp('bonus_paid_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export type Referral = InferSelectModel<typeof referrals>;

export const demo = pgTable('Demo', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  name: text('name').notNull().unique(),
  logo_name: text('logo_name').notNull(),
  logo_url: text('logo_url'),
  background_color: text('background_color'),

  // Typewriter тексты
  typewriterText1: text('typewriterText1'),
  typewriterText2: text('typewriterText2'),
  typewriterText3: text('typewriterText3'),
  typewriterText4: text('typewriterText4'),

  // Hero секция
  hero_title: text('hero_title'),
  hero_subtitle: text('hero_subtitle'),

  // Features секция (только для первого feature)
  features_title: text('features_title'),
  features_subtitle: text('features_subtitle'),
  features1_title: text('features1_title'),
  features1_h3: text('features1_h3'),
  features1_p: text('features1_p'),

  // Models секция
  models_title: text('models_title'),
  models_subtitle: text('models_subtitle'),

  // Pricing секция
  pricing_title: text('pricing_title'),
  pricing_subtitle: text('pricing_subtitle'),

  // Footer
  footer_text: text('footer_text'),

  created_at: timestamp('created_at').notNull().defaultNow(),
});

export type Demo = InferSelectModel<typeof demo>;

// Invites
export const invites = pgTable('invites', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  code: varchar('code', { length: 16 }).notNull().unique(),
  owner_user_id: text('owner_user_id')
    .notNull()
    .references(() => user.id),
  available_count: integer('available_count').notNull().default(4),
  used_count: integer('used_count').notNull().default(0),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export type Invite = InferSelectModel<typeof invites>;

// Reposts
export const repost = pgTable(
  'Repost',
  {
    chatId: text('chatId')
      .notNull()
      .references(() => chat.id),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.userId] }),
    };
  },
);

export type Repost = InferSelectModel<typeof repost>;
