-- SyncUp — initial schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT        NOT NULL UNIQUE,
  email        TEXT        NOT NULL,
  display_name TEXT        NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users (clerk_id);

-- ── Timetable blocks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_code TEXT,
  lesson_type TEXT,
  class_no    TEXT,
  title       TEXT        NOT NULL,
  day         TEXT        NOT NULL,
  start_time  TEXT        NOT NULL,
  end_time    TEXT        NOT NULL,
  weeks       JSONB       NOT NULL DEFAULT '[]',
  venue       TEXT,
  source      TEXT        NOT NULL,
  color       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS timetable_blocks_user_id_idx ON timetable_blocks (user_id);
CREATE INDEX IF NOT EXISTS timetable_blocks_module_idx  ON timetable_blocks (user_id, module_code);

-- ── NUSMods module cache ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nusmods_cache (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code   TEXT        NOT NULL,
  academic_year TEXT        NOT NULL,
  semester      INTEGER     NOT NULL,
  data          JSONB       NOT NULL,
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_code, academic_year, semester)
);

-- ── Friendships ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id);

-- ── Groups ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  type          TEXT        NOT NULL,
  created_by_id UUID        NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID        NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- ── Events ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  created_by_id UUID        NOT NULL REFERENCES users(id),
  group_id      UUID        REFERENCES groups(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_slots (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID        NOT NULL REFERENCES events(id)     ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS event_votes (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id   UUID        NOT NULL REFERENCES event_slots(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  available BOOLEAN     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slot_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_invitees (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  UNIQUE (event_id, user_id)
);

-- ── Feed ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS feed_posts_user_id_idx ON feed_posts (user_id);

CREATE TABLE IF NOT EXISTS feed_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  emoji      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, emoji)
);

-- ── Privacy settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_settings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  timetable_visibility  TEXT        NOT NULL DEFAULT 'friends',
  free_time_visibility  TEXT        NOT NULL DEFAULT 'friends',
  feed_visibility       TEXT        NOT NULL DEFAULT 'friends',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
