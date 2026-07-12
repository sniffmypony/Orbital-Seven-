ALTER TABLE "timetable_blocks" ADD COLUMN "profile_visible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "timetable_blocks" SET "profile_visible" = true WHERE "source" = 'nusmods';