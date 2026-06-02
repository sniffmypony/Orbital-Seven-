ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "major" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_block_visibility" text DEFAULT 'friends' NOT NULL;