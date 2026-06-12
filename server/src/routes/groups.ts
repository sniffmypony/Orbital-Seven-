import { Router } from 'express'
import { and, eq, ne, inArray, desc, isNull, count } from 'drizzle-orm'
import { db } from '../db'
import {
  groups, groupMembers, messages, messageReads, polls, pollVotes, groupEvents,
  users, timetableBlocks,
} from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import { getFriendshipBetween } from '../services/friendService'
import { getVisibleBlocks } from '../services/timetableService'
import { computeGroupAvailability } from '../services/groupAvailabilityService'

const router = Router()

const POLL_CHOICES = ['coming', 'maybe', 'cant']

function publicUser(u: { id: string; displayName: string; avatarUrl: string | null }) {
  return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl }
}

async function getMembership(groupId: string, userId: string) {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const myMemberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, me.id))

    const groupIds = myMemberships.map((m) => m.groupId)
    if (groupIds.length === 0) {
      res.json([])
      return
    }

    const groupRows = await db.select().from(groups).where(inArray(groups.id, groupIds))
    const result = []

    for (const g of groupRows) {
      const [{ value: memberCount }] = await db
        .select({ value: count() })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, g.id))

      const [last] = await db
        .select()
        .from(messages)
        .where(eq(messages.groupId, g.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)

      const [{ value: unread }] = await db
        .select({ value: count() })
        .from(messages)
        .leftJoin(messageReads, and(eq(messageReads.messageId, messages.id), eq(messageReads.userId, me.id)))
        .where(and(eq(messages.groupId, g.id), ne(messages.senderId, me.id), isNull(messageReads.id)))

      const membership = myMemberships.find((m) => m.groupId === g.id)!

      result.push({
        id: g.id,
        name: g.name,
        avatarUrl: g.avatarUrl,
        memberCount,
        muted: membership.muted,
        unread,
        lastMessage: last
          ? { kind: last.kind, text: last.text, createdAt: last.createdAt }
          : null,
      })
    }

    result.sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return tb - ta
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const { name, avatarUrl, memberIds } = req.body as { name: string; avatarUrl?: string; memberIds?: string[] }

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'A group name is required.' })
      return
    }

    const [group] = await db
      .insert(groups)
      .values({ name: name.trim(), type: 'chat', avatarUrl: avatarUrl?.trim() || null, createdById: me.id })
      .returning()

    const memberSet = new Set<string>([me.id, ...(memberIds ?? [])])
    for (const userId of memberSet) {
      await db
        .insert(groupMembers)
        .values({ groupId: group.id, userId, role: userId === me.id ? 'admin' : 'member' })
        .onConflictDoNothing()
    }

    res.status(201).json(group)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }

    const [group] = await db.select().from(groups).where(eq(groups.id, req.params.id)).limit(1)
    if (!group) {
      res.status(404).json({ message: 'Group not found.' })
      return
    }

    const memberRows = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id))
    const memberUsers = await db.select().from(users).where(inArray(users.id, memberRows.map((m) => m.userId)))
    const userMap = new Map(memberUsers.map((u) => [u.id, u]))

    const members = []
    for (const m of memberRows) {
      const u = userMap.get(m.userId)!
      let friendship: 'self' | 'friends' | 'pending' | 'none' = 'none'
      if (m.userId === me.id) {
        friendship = 'self'
      } else {
        const f = await getFriendshipBetween(me.id, m.userId)
        if (f && f.status === 'accepted') friendship = 'friends'
        else if (f && f.status === 'pending') friendship = 'pending'
      }
      members.push({ user: publicUser(u), role: m.role, isSelf: m.userId === me.id, friendship })
    }

    res.json({
      group: { id: group.id, name: group.name, avatarUrl: group.avatarUrl },
      members,
      myRole: membership.role,
      muted: membership.muted,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership || membership.role !== 'admin') {
      res.status(403).json({ message: 'Only an admin can edit this group.' })
      return
    }
    const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string }
    const set: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) set.name = name.trim()
    if (typeof avatarUrl === 'string') set.avatarUrl = avatarUrl.trim() || null

    const [updated] = await db.update(groups).set(set).where(eq(groups.id, req.params.id)).returning()
    res.json({ id: updated.id, name: updated.name, avatarUrl: updated.avatarUrl })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership || membership.role !== 'admin') {
      res.status(403).json({ message: 'Only an admin can add members.' })
      return
    }
    const { userId } = req.body as { userId: string }
    if (!userId) {
      res.status(400).json({ message: 'userId is required.' })
      return
    }
    await db
      .insert(groupMembers)
      .values({ groupId: req.params.id, userId, role: 'member' })
      .onConflictDoNothing()
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(204).send()
      return
    }
    const target = req.params.userId
    if (target !== me.id && membership.role !== 'admin') {
      res.status(403).json({ message: 'Only an admin can remove other members.' })
      return
    }
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, req.params.id), eq(groupMembers.userId, target)))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post('/:id/mute', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const { muted } = req.body as { muted: boolean }
    await db
      .update(groupMembers)
      .set({ muted: !!muted })
      .where(and(eq(groupMembers.groupId, req.params.id), eq(groupMembers.userId, me.id)))
    res.json({ muted: !!muted })
  } catch (err) {
    next(err)
  }
})

async function serializeMessages(groupId: string, meId: string) {
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.groupId, groupId))
    .orderBy(messages.createdAt)

  if (msgs.length === 0) return []

  const ids = msgs.map((m) => m.id)
  const senderRows = await db.select().from(users).where(inArray(users.id, msgs.map((m) => m.senderId)))
  const userMap = new Map(senderRows.map((u) => [u.id, u]))

  const reads = await db.select().from(messageReads).where(inArray(messageReads.messageId, ids))
  const readsByMsg = new Map<string, string[]>()
  for (const r of reads) {
    const list = readsByMsg.get(r.messageId) ?? []
    list.push(r.userId)
    readsByMsg.set(r.messageId, list)
  }

  const pollRows = await db.select().from(polls).where(inArray(polls.messageId, ids))
  const pollByMsg = new Map(pollRows.map((p) => [p.messageId, p]))
  const pollIds = pollRows.map((p) => p.id)
  const votes = pollIds.length ? await db.select().from(pollVotes).where(inArray(pollVotes.pollId, pollIds)) : []
  const voteUserIds = votes.map((v) => v.userId)
  const voteUsers = voteUserIds.length ? await db.select().from(users).where(inArray(users.id, voteUserIds)) : []
  const voteUserMap = new Map(voteUsers.map((u) => [u.id, u]))

  const eventRows = await db.select().from(groupEvents).where(inArray(groupEvents.messageId, ids))
  const eventByMsg = new Map(eventRows.map((e) => [e.messageId, e]))

  return msgs.map((m) => {
    const sender = userMap.get(m.senderId)!
    const out: Record<string, unknown> = {
      id: m.id,
      kind: m.kind,
      text: m.text,
      mediaUrl: m.mediaUrl,
      createdAt: m.createdAt,
      sender: publicUser(sender),
      readBy: (readsByMsg.get(m.id) ?? []).filter((uid) => uid !== m.senderId),
      mine: m.senderId === meId,
    }

    const poll = pollByMsg.get(m.id)
    if (poll) {
      const pv = votes.filter((v) => v.pollId === poll.id)
      out.poll = {
        id: poll.id,
        question: poll.question,
        options: POLL_CHOICES.map((choice) => ({
          choice,
          voters: pv.filter((v) => v.choice === choice).map((v) => voteUserMap.get(v.userId)?.displayName ?? 'Someone'),
        })),
        myVote: pv.find((v) => v.userId === meId)?.choice ?? null,
      }
    }

    const ev = eventByMsg.get(m.id)
    if (ev) {
      out.event = {
        id: ev.id,
        title: ev.title,
        day: ev.day,
        startTime: ev.startTime,
        endTime: ev.endTime,
        venue: ev.venue,
      }
    }

    return out
  })
}

router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    res.json(await serializeMessages(req.params.id, me.id))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const { kind, text, mediaUrl } = req.body as { kind?: string; text?: string; mediaUrl?: string }
    const resolvedKind = ['text', 'image', 'video'].includes(kind ?? '') ? kind! : 'text'
    if (resolvedKind === 'text' && !(text && text.trim())) {
      res.status(400).json({ message: 'Message text is required.' })
      return
    }
    if ((resolvedKind === 'image' || resolvedKind === 'video') && !(mediaUrl && mediaUrl.trim())) {
      res.status(400).json({ message: 'A media URL is required.' })
      return
    }
    const [msg] = await db
      .insert(messages)
      .values({
        groupId: req.params.id,
        senderId: me.id,
        kind: resolvedKind,
        text: text?.trim() || null,
        mediaUrl: mediaUrl?.trim() || null,
      })
      .returning()
    res.status(201).json(msg)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const unreadMsgs = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(messageReads, and(eq(messageReads.messageId, messages.id), eq(messageReads.userId, me.id)))
      .where(and(eq(messages.groupId, req.params.id), ne(messages.senderId, me.id), isNull(messageReads.id)))

    for (const m of unreadMsgs) {
      await db.insert(messageReads).values({ messageId: m.id, userId: me.id }).onConflictDoNothing()
    }
    res.json({ marked: unreadMsgs.length })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/polls', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const { question } = req.body as { question: string }
    if (!question || !question.trim()) {
      res.status(400).json({ message: 'A poll question is required.' })
      return
    }
    const [msg] = await db
      .insert(messages)
      .values({ groupId: req.params.id, senderId: me.id, kind: 'poll', text: question.trim() })
      .returning()
    await db.insert(polls).values({ messageId: msg.id, question: question.trim() })
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/polls/:pollId/vote', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const { choice } = req.body as { choice: string }
    if (!POLL_CHOICES.includes(choice)) {
      res.status(400).json({ message: 'Invalid choice.' })
      return
    }
    await db
      .insert(pollVotes)
      .values({ pollId: req.params.pollId, userId: me.id, choice })
      .onConflictDoUpdate({ target: [pollVotes.pollId, pollVotes.userId], set: { choice } })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/events', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const { title, day, startTime, endTime, venue } = req.body as {
      title: string; day: string; startTime: string; endTime: string; venue?: string
    }
    if (!title || !day || !startTime || !endTime) {
      res.status(400).json({ message: 'title, day, startTime and endTime are required.' })
      return
    }
    const [msg] = await db
      .insert(messages)
      .values({ groupId: req.params.id, senderId: me.id, kind: 'event', text: title.trim() })
      .returning()
    await db.insert(groupEvents).values({
      messageId: msg.id,
      groupId: req.params.id,
      createdById: me.id,
      title: title.trim(),
      day,
      startTime,
      endTime,
      venue: venue?.trim() || null,
    })
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/events/:eventId/add', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }
    const [ev] = await db.select().from(groupEvents).where(eq(groupEvents.id, req.params.eventId)).limit(1)
    if (!ev) {
      res.status(404).json({ message: 'Event not found.' })
      return
    }
    const { recurrence, weeks } = req.body as { recurrence: 'once' | 'weeks' | 'never'; weeks?: number }

    let weekList: number[] = [1]
    if (recurrence === 'never') {
      weekList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    } else if (recurrence === 'weeks') {
      const n = Math.max(1, Math.min(13, Number(weeks) || 1))
      weekList = Array.from({ length: n }, (_, i) => i + 1)
    }

    const [block] = await db
      .insert(timetableBlocks)
      .values({
        userId: me.id,
        moduleCode: null,
        lessonType: null,
        classNo: null,
        title: ev.title,
        day: ev.day,
        startTime: ev.startTime,
        endTime: ev.endTime,
        weeks: weekList,
        venue: ev.venue,
        note: null,
        source: 'custom',
        color: '#8b5cf6',
        visibility: me.defaultBlockVisibility,
      })
      .returning()

    res.status(201).json(block)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/freetime', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const membership = await getMembership(req.params.id, me.id)
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this group.' })
      return
    }

    const memberRows = await db.select().from(groupMembers).where(eq(groupMembers.groupId, req.params.id))
    const memberUsers = await db.select().from(users).where(inArray(users.id, memberRows.map((m) => m.userId)))

    const participants = memberUsers.map((u) => ({ id: u.id, name: u.id === me.id ? 'You' : u.displayName }))
    const blocksByUser = []
    for (const p of participants) {
      blocksByUser.push(await getVisibleBlocks(p.id, me.id))
    }

    const availability = computeGroupAvailability(participants, blocksByUser)
    res.json({ totalCount: participants.length, ...availability })
  } catch (err) {
    next(err)
  }
})

export default router
