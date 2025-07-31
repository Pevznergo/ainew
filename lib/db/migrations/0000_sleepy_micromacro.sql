CREATE TABLE IF NOT EXISTS "Chat" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"userId" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Document" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"kind" text DEFAULT 'text' NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message_v2" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"role" text NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "models" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"yookassa_payment_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"subscription_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_id" text NOT NULL,
	"bonus_paid" boolean DEFAULT false NOT NULL,
	"bonus_paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Stream" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"documentId" text NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"referral_code" text,
	"referred_by" text,
	"referral_bonus_paid" boolean DEFAULT false,
	"subscription_active" boolean DEFAULT false,
	"type" text DEFAULT 'guest' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Vote_v2" (
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"isUpvoted" boolean NOT NULL,
	CONSTRAINT "Vote_v2_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Stream" ADD CONSTRAINT "Stream_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_Document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
