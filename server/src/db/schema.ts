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
  bio:         text('bio'),
  major:       text('major'),
  defaultBlockVisibility: text('default_block_visibility').notNull().default('friends'),
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
  note:        text('note'),
  source:      text('source').notNull(),
  color:       text('color').notNull(),
  visibility:  text('visibility').notNull().default('friends'),
  profileVisible: boolean('profile_visible').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const timetableBlockVisibility = pgTable('timetable_block_visibility', {
  id:      uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id').notNull().references(() => timetableBlocks.id, { onDelete: 'cascade' }),
  userId:  uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniq: unique().on(t.blockId, t.userId),
}))

export const userBlocks = pgTable('user_blocks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.blockerId, t.blockedId),
}))

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
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  description:    text('description'),
  type:           text('type').notNull(),
  avatarUrl:      text('avatar_url'),
  allowMemberAdd: boolean('allow_member_add').notNull().default(false),
  createdById:    uuid('created_by_id').notNull().references(() => users.id),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const groupMembers = pgTable('group_members', {
  id:       uuid('id').primaryKey().defaultRandom(),
  groupId:  uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:     text('role').notNull().default('member'),
  muted:    boolean('muted').notNull().default(false),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.groupId, t.userId),
}))

export const messages = pgTable('messages', {
  id:        uuid('id').primaryKey().defaultRandom(),
  groupId:   uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  senderId:  uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind:      text('kind').notNull().default('text'),
  text:      text('text'),
  mediaUrl:  text('media_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const messageReads = pgTable('message_reads', {
  id:        uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt:    timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.messageId, t.userId),
}))

export const polls = pgTable('polls', {
  id:        uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }).unique(),
  question:  text('question').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const pollOptions = pgTable('poll_options', {
  id:          uuid('id').primaryKey().defaultRandom(),
  pollId:      uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  label:       text('label').notNull(),
  isDefault:   boolean('is_default').notNull().default(false),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const pollVotes = pgTable('poll_votes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  pollId:    uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId:  uuid('option_id').references(() => pollOptions.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  choice:    text('choice'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.pollId, t.userId),
}))

export const groupEvents = pgTable('group_events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  messageId:   uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }).unique(),
  groupId:     uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  day:         text('day').notNull(),
  startTime:   text('start_time').notNull(),
  endTime:     text('end_time').notNull(),
  venue:       text('venue'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

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
