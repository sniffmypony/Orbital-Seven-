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

export const users = pgTable('users', {
  id:          uuid('id').primaryKey().defaultRandom(),
  clerkId:     text('clerk_id').notNull().unique(),
  email:       text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl:   text('avatar_url'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const timetableBlocks = pgTable('timetable_blocks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleCode:  text('module_code'),
  lessonType:  text('lesson_type'),
  classNo:     text('class_no'),
  title:       text('title').notNull(),
  day:         text('day').notNull(),
  startTime:   text('start_time').notNull(),
  endTime:     text('end_time').notNull(),
  weeks:       json('weeks').$type<number[]>().notNull(),
  venue:       text('venue'),
  source:      text('source').notNull(),
  color:       text('color').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const nusmodsCache = pgTable('nusmods_cache', {
  id:           uuid('id').primaryKey().defaultRandom(),
  moduleCode:   text('module_code').notNull(),
  academicYear: text('academic_year').notNull(),
  semester:     integer('semester').notNull(),
  data:         json('data').notNull(),
  cachedAt:     timestamp('cached_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.moduleCode, t.academicYear, t.semester),
}))

export const friendships = pgTable('friendships', {
  id:          uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addresseeId: uuid('addressee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status:      text('status').notNull().default('pending'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.requesterId, t.addresseeId),
}))

export const groups = pgTable('groups', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  description: text('description'),
  type:        text('type').notNull(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const groupMembers = pgTable('group_members', {
  id:       uuid('id').primaryKey().defaultRandom(),
  groupId:  uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:     text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.groupId, t.userId),
}))

export const events = pgTable('events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  description: text('description'),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  groupId:     uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const eventSlots = pgTable('event_slots', {
  id:            uuid('id').primaryKey().defaultRandom(),
  eventId:       uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime:   timestamp('end_datetime',   { withTimezone: true }).notNull(),
})

export const eventVotes = pgTable('event_votes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  slotId:    uuid('slot_id').notNull().references(() => eventSlots.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  available: boolean('available').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.slotId, t.userId),
}))

export const eventInvitees = pgTable('event_invitees', {
  id:      uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId:  uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniq: unique().on(t.eventId, t.userId),
}))

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

export const privacySettings = pgTable('privacy_settings', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  timetableVisibility:  text('timetable_visibility').notNull().default('friends'),
  freeTimeVisibility:   text('free_time_visibility').notNull().default('friends'),
  feedVisibility:       text('feed_visibility').notNull().default('friends'),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
