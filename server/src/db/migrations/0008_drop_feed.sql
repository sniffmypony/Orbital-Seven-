DROP TABLE IF EXISTS "feed_reactions";
DROP TABLE IF EXISTS "feed_posts";
ALTER TABLE "privacy_settings" DROP COLUMN IF EXISTS "feed_visibility";
