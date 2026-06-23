import { Router } from 'express'
import { and, eq, ne, inArray, isNull, count } from 'drizzle-orm'
import { db } from '../db'
import { friendships, groupMembers, messages, messageReads } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import { getBlockedIds } from '../services/friendService'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const pending = await db
      .select({ requesterId: friendships.requesterId })
      .from(friendships)
      .where(and(eq(friendships.addresseeId, me.id), eq(friendships.status, 'pending')))
    const blockedIds = await getBlockedIds(me.id)
    const friendRequests = pending.filter((p) => !blockedIds.includes(p.requesterId)).length

    const myGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, me.id))

    let groupsUnread = 0
    for (const g of myGroups) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(messages)
        .leftJoin(messageReads, and(eq(messageReads.messageId, messages.id), eq(messageReads.userId, me.id)))
        .where(and(eq(messages.groupId, g.groupId), ne(messages.senderId, me.id), isNull(messageReads.id)))
      if (value > 0) groupsUnread += 1
    }

    res.json({ friendRequests, groupsUnread })
  } catch (err) {
    next(err)
  }
})

export default router
