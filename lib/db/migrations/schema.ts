import { pgTable, foreignKey, unique, text, varchar, integer, timestamp, boolean, json, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const invites = pgTable("invites", {
	id: text().primaryKey().notNull(),
	code: varchar({ length: 16 }).notNull(),
	ownerUserId: text("owner_user_id").notNull(),
	availableCount: integer("available_count").default(4).notNull(),
	usedCount: integer("used_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		invitesOwnerUserIdUserIdFk: foreignKey({
			columns: [table.ownerUserId],
			foreignColumns: [user.id],
			name: "invites_owner_user_id_User_id_fk"
		}),
		invitesCodeUnique: unique("invites_code_unique").on(table.code),
	}
});

export const demo = pgTable("Demo", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	logoName: text("logo_name").notNull(),
	logoUrl: text("logo_url"),
	backgroundColor: text("background_color"),
	typewriterText1: text(),
	typewriterText2: text(),
	typewriterText3: text(),
	typewriterText4: text(),
	heroTitle: text("hero_title"),
	heroSubtitle: text("hero_subtitle"),
	featuresTitle: text("features_title"),
	featuresSubtitle: text("features_subtitle"),
	features1Title: text("features1_title"),
	features1H3: text("features1_h3"),
	features1P: text("features1_p"),
	modelsTitle: text("models_title"),
	modelsSubtitle: text("models_subtitle"),
	pricingTitle: text("pricing_title"),
	pricingSubtitle: text("pricing_subtitle"),
	footerText: text("footer_text"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		demoNameUnique: unique("Demo_name_unique").on(table.name),
	}
});

export const models = pgTable("models", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 64 }).notNull(),
	cost: integer().notNull(),
});

export const referrals = pgTable("referrals", {
	id: text().primaryKey().notNull(),
	referrerId: text("referrer_id").notNull(),
	referredId: text("referred_id").notNull(),
	bonusPaid: boolean("bonus_paid").default(false).notNull(),
	bonusPaidAt: timestamp("bonus_paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const chat = pgTable("Chat", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	title: text().notNull(),
	userId: text().notNull(),
	visibility: text().default('public').notNull(),
	hashtags: varchar({ length: 64 }).array(),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
	}
});

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	balance: integer().default(0).notNull(),
	referralCode: text("referral_code"),
	referredBy: text("referred_by"),
	referralBonusPaid: boolean("referral_bonus_paid").default(false),
	subscriptionActive: boolean("subscription_active").default(false),
	type: text().default('guest').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		userEmailUnique: unique("User_email_unique").on(table.email),
	}
});

export const document = pgTable("Document", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	title: text().notNull(),
	content: text(),
	kind: text().default('text').notNull(),
	userId: text().notNull(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
	}
});

export const messageV2 = pgTable("Message_v2", {
	id: text().primaryKey().notNull(),
	chatId: text().notNull(),
	role: text().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		messageV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_v2_chatId_Chat_id_fk"
		}),
	}
});

export const payments = pgTable("payments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	yookassaPaymentId: text("yookassa_payment_id").notNull(),
	amount: integer().notNull(),
	status: text().notNull(),
	subscriptionType: text("subscription_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		paymentsUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "payments_user_id_User_id_fk"
		}),
	}
});

export const stream = pgTable("Stream", {
	id: text().primaryKey().notNull(),
	chatId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		streamChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Stream_chatId_Chat_id_fk"
		}),
	}
});

export const suggestion = pgTable("Suggestion", {
	id: text().primaryKey().notNull(),
	documentId: text().notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		suggestionDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "Suggestion_documentId_Document_id_fk"
		}),
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
	}
});

export const voteV2 = pgTable("Vote_v2", {
	chatId: text().notNull(),
	messageId: text().notNull(),
	isUpvoted: boolean().notNull(),
	userId: text().notNull(),
},
(table) => {
	return {
		voteV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_v2_chatId_Chat_id_fk"
		}),
		voteV2MessageIdMessageV2IdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [messageV2.id],
			name: "Vote_v2_messageId_Message_v2_id_fk"
		}),
		voteV2UserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Vote_v2_userId_User_id_fk"
		}),
		voteV2ChatIdUserIdPk: primaryKey({ columns: [table.chatId, table.userId], name: "Vote_v2_chatId_userId_pk"}),
	}
});