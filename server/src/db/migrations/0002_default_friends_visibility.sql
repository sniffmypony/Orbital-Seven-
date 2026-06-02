ALTER TABLE "timetable_blocks" ALTER COLUMN "visibility" SET DEFAULT 'friends';--> statement-breakpoint
UPDATE "timetable_blocks" SET "visibility" = 'friends' WHERE "visibility" = 'private';