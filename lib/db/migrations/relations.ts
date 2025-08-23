import { relations } from "drizzle-orm/relations";
import { user, invites, chat, document, messageV2, payments, stream, suggestion, voteV2 } from "./schema";

export const invitesRelations = relations(invites, ({one}) => ({
	user: one(user, {
		fields: [invites.ownerUserId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	invites: many(invites),
	chats: many(chat),
	documents: many(document),
	payments: many(payments),
	suggestions: many(suggestion),
	voteV2s: many(voteV2),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	messageV2s: many(messageV2),
	streams: many(stream),
	voteV2s: many(voteV2),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
	suggestions: many(suggestion),
}));

export const messageV2Relations = relations(messageV2, ({one, many}) => ({
	chat: one(chat, {
		fields: [messageV2.chatId],
		references: [chat.id]
	}),
	voteV2s: many(voteV2),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	user: one(user, {
		fields: [payments.userId],
		references: [user.id]
	}),
}));

export const streamRelations = relations(stream, ({one}) => ({
	chat: one(chat, {
		fields: [stream.chatId],
		references: [chat.id]
	}),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
}));

export const voteV2Relations = relations(voteV2, ({one}) => ({
	chat: one(chat, {
		fields: [voteV2.chatId],
		references: [chat.id]
	}),
	messageV2: one(messageV2, {
		fields: [voteV2.messageId],
		references: [messageV2.id]
	}),
	user: one(user, {
		fields: [voteV2.userId],
		references: [user.id]
	}),
}));