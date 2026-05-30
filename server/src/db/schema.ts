import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  json,
  unique,
} from 'drizzle-orm/pg-core'

// ── Users ─────────────────────────────────────────────────────────────────────
// Synced from Clerk via webhook on sign-up and profile update.
export const users = pgTable('users', {
  id:          uuid('id').primaryKey().defaultRandom(),
  clerkId:     text('clerk_id').notNull().unique(),
  email:       text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl:   text('avatar_url'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── Timetable blocks ──────────────────────────────────────────────────────────
// Stores all busy slots regardless of source (NUSMods import or custom entry).
export const timetableBlocks = pgTable('timetable_blocks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleCode:  text('module_code'),   // null for custom blocks
  lessonType:  text('lesson_type'),   // "Lecture" | "Tutorial" | "Lab" | null
  classNo:     text('class_no'),      // NUSMods class number, null for custom
  title:       text('title').notNull(),
  day:         text('day').notNull(), // "Monday" … "Sunday"
  startTime:   text('start_time').notNull(), // "0800"
  endTime:     text('end_time').notNull(),   // "1000"
  weeks:       json('weeks').$type<number[]>().notNull(), // [1,2,...,13]
  venue:       text('venue'),
  source:      text('source').notNull(), // "nusmods" | "custom"
  color:       text('color').notNull(),  // hex e.g. "#6366f1"
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── NUSMods module cache ───────────────────────────────────────────────────────
// Caches full NUSMods API responses to avoid re-fetching on every import.
// Keyed by (moduleCode, academicYear, semester).
export const nusmodsCache = pgTable('nusmods_cache', {
  id:           uuid('id').primaryKey().defaultRandom(),
  moduleCode:   text('module_code').notNull(),
  academicYear: text('academic_year').notNull(), // "2024-2025"
  semester:     integer('semester').notNull(),   // 1 or 2
  data:         json('data').notNull(),           // raw NUSMods API response
  cachedAt:     timestamp('cached_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.moduleCode, t.academicYear, t.semester),
}))

// ── Friendships ───────────────────────────────────────────────────────────────
export const friendships = pgTable('friendships', {
  id:          uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addresseeId: uuid('addressee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status:      text('status').notNull().default('pending'), // "pending"|"accepted"|"rejected"
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.requesterId, t.addresseeId),
}))

// ── Groups ────────────────────────────────────────────────────────────────────
export const groups = pgTable('groups', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  description: text('description'),
  type:        text('type').notNull(), // "study"|"project"|"social"
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const groupMembers = pgTable('group_members', {
  id:       uuid('id').primaryKey().defaultRandom(),
  groupId:  uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:     text('role').notNull().default('member'), // "admin"|"member"
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.groupId, t.userId),
}))

// ── Events ────────────────────────────────────────────────────────────────────
export const events = pgTable('events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  description: text('description'),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  groupId:     uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Time slot options proposed for an event
export const eventSlots = pgTable('event_slots', {
  id:            uuid('id').primaryKey().defaultRandom(),
  eventId:       uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime:   timestamp('end_datetime',   { withTimezone: true }).notNull(),
})

// Votes cast on a slot — one row per (slot, user)
export const eventVotes = pgTable('event_votes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  slotId:    uuid('slot_id').notNull().references(() => eventSlots.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  available: boolean('available').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.slotId, t.userId),
}))

// Users invited to an event
export const eventInvitees = pgTable('event_invitees', {
  id:      uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId:  uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniq: unique().on(t.eventId, t.userId),
}))

// ── Social feed ───────────────────────────────────────────────────────────────
export const feedPosts = pgTable('feed_posts', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const feedReactions = pgTable('feed_reactions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => feedPosts.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji:     text('emoji').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.postId, t.userId, t.emoji),
}))

// ── Privacy settings ──────────────────────────────────────────────────────────
// One row per user, created with defaults on sign-up.
export const privacySettings = pgTable('privacy_settings', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  timetableVisibility:  text('timetable_visibility').notNull().default('friends'), // "public"|"friends"|"private"
  freeTimeVisibility:   text('free_time_visibility').notNull().default('friends'),
  feedVisibility:       text('feed_visibility').notNull().default('friends'),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
