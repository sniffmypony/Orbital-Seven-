import { Router } from 'express'
import { and, eq, or, ne, ilike, inArray } from 'drizzle-orm'
import { db } from '../db'
import { friendships, users, timetableBlocks, timetableBlockVisibility, userBlocks } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import { getFriendshipBetween, areFriends, getBlockedIds } from '../services/friendService'

const router = Router()

function publicUser(u: { id: string; displayName: string; email: string; avatarUrl: string | null }) {
  return { id: u.id, displayName: u.displayName, email: u.email, avatarUrl: u.avatarUrl }
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const rows = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id))
        )
      )

    const friendIds = rows.map((r) => (r.requesterId === me.id ? r.addresseeId : r.requesterId))
    if (friendIds.length === 0) {
      res.json([])
      return
    }

    const friendUsers = await db.select().from(users).where(inArray(users.id, friendIds))
    const userMap = new Map(friendUsers.map((u) => [u.id, u]))

    const result = rows.map((r) => {
      const otherId = r.requesterId === me.id ? r.addresseeId : r.requesterId
      return {
        friendshipId: r.id,
        status: r.status,
        user: publicUser(userMap.get(otherId)!),
      }
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/requests', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const rows = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.addresseeId, me.id), eq(friendships.status, 'pending')))

    const blockedIds = await getBlockedIds(me.id)
    const visibleRows = rows.filter((r) => !blockedIds.includes(r.requesterId))

    const requesterIds = visibleRows.map((r) => r.requesterId)
    if (requesterIds.length === 0) {
      res.json([])
      return
    }

    const requesters = await db.select().from(users).where(inArray(users.id, requesterIds))
    const userMap = new Map(requesters.map((u) => [u.id, u]))

    res.json(
      visibleRows.map((r) => ({
        friendshipId: r.id,
        createdAt: r.createdAt,
        user: publicUser(userMap.get(r.requesterId)!),
      }))
    )
  } catch (err) {
    next(err)
  }
})

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const q = String(req.query.q ?? '').trim()
    if (!q) {
      res.json([])
      return
    }

    const found = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, me.id),
          or(ilike(users.displayName, `%${q}%`), ilike(users.email, `%${q}%`))
        )
      )
      .limit(20)

    const rels = await db
      .select()
      .from(friendships)
      .where(or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id)))

    const blockedIds = await getBlockedIds(me.id)

    function relationshipFor(uid: string): string {
      if (blockedIds.includes(uid)) return 'blocked'
      const f = rels.find(
        (r) =>
          (r.requesterId === me.id && r.addresseeId === uid) ||
          (r.addresseeId === me.id && r.requesterId === uid)
      )
      if (!f) return 'none'
      if (f.status === 'accepted') return 'friends'
      if (f.status === 'pending') return f.requesterId === me.id ? 'outgoing' : 'incoming'
      return 'none'
    }

    res.json(
      found.map((u) => ({
        ...publicUser(u),
        relationship: relationshipFor(u.id),
      }))
    )
  } catch (err) {
    next(err)
  }
})

router.get('/:friendId/timetable', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const friendId = req.params.friendId

    const ok = await areFriends(me.id, friendId)
    if (!ok) {
      res.status(403).json({ message: 'You are not friends with this user.' })
      return
    }

    const friendRows = await db.select().from(users).where(eq(users.id, friendId)).limit(1)
    const friend = friendRows[0]
    if (!friend) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    const allBlocks = await db
      .select()
      .from(timetableBlocks)
      .where(eq(timetableBlocks.userId, friendId))

    const overrideBlockIds = new Set<string>()
    const overrideCandidates = allBlocks
      .filter((b) => b.visibility === 'only' || b.visibility === 'except')
      .map((b) => b.id)

    if (overrideCandidates.length > 0) {
      const overrides = await db
        .select({ blockId: timetableBlockVisibility.blockId })
        .from(timetableBlockVisibility)
        .where(
          and(
            inArray(timetableBlockVisibility.blockId, overrideCandidates),
            eq(timetableBlockVisibility.userId, me.id)
          )
        )
      for (const o of overrides) overrideBlockIds.add(o.blockId)
    }

    const visibleBlocks = allBlocks.filter((b) => {
      switch (b.visibility) {
        case 'public':
        case 'friends':
          return true
        case 'only':
          return overrideBlockIds.has(b.id)
        case 'except':
          return !overrideBlockIds.has(b.id)
        default:
          return false
      }
    })

    res.json({ user: publicUser(friend), blocks: visibleBlocks })
  } catch (err) {
    next(err)
  }
})

router.post('/request', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const { addresseeId } = req.body as { addresseeId: string }

    if (!addresseeId) {
      res.status(400).json({ message: 'addresseeId is required.' })
      return
    }
    if (addresseeId === me.id) {
      res.status(400).json({ message: 'You cannot add yourself.' })
      return
    }

    const target = await db.select().from(users).where(eq(users.id, addresseeId)).limit(1)
    if (target.length === 0) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    const existing = await getFriendshipBetween(me.id, addresseeId)
    if (existing) {
      if (existing.status === 'accepted') {
        res.status(409).json({ message: 'You are already friends.' })
        return
      }
      if (existing.status === 'pending') {
        res.status(409).json({ message: 'A request is already pending.' })
        return
      }
      const [reopened] = await db
        .update(friendships)
        .set({ requesterId: me.id, addresseeId, status: 'pending', updatedAt: new Date() })
        .where(eq(friendships.id, existing.id))
        .returning()
      res.status(201).json(reopened)
      return
    }

    const [created] = await db
      .insert(friendships)
      .values({ requesterId: me.id, addresseeId, status: 'pending' })
      .returning()

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.get('/blocked', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const rows = await db.select().from(userBlocks).where(eq(userBlocks.blockerId, me.id))
    const ids = rows.map((r) => r.blockedId)
    if (ids.length === 0) {
      res.json([])
      return
    }

    const blockedUsers = await db.select().from(users).where(inArray(users.id, ids))
    const userMap = new Map(blockedUsers.map((u) => [u.id, u]))

    res.json(
      rows.map((r) => ({
        blockId: r.id,
        createdAt: r.createdAt,
        user: publicUser(userMap.get(r.blockedId)!),
      }))
    )
  } catch (err) {
    next(err)
  }
})

router.post('/block', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const { userId } = req.body as { userId: string }

    if (!userId) {
      res.status(400).json({ message: 'userId is required.' })
      return
    }
    if (userId === me.id) {
      res.status(400).json({ message: 'You cannot block yourself.' })
      return
    }

    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (target.length === 0) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    const existing = await getFriendshipBetween(me.id, userId)
    if (existing) {
      await db.delete(friendships).where(eq(friendships.id, existing.id))
    }

    const [created] = await db
      .insert(userBlocks)
      .values({ blockerId: me.id, blockedId: userId })
      .onConflictDoNothing({ target: [userBlocks.blockerId, userBlocks.blockedId] })
      .returning()

    res.status(201).json(created ?? { blockerId: me.id, blockedId: userId })
  } catch (err) {
    next(err)
  }
})

router.delete('/block/:userId', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, me.id), eq(userBlocks.blockedId, req.params.userId)))

    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const { action } = req.body as { action: 'accept' | 'reject' }

    if (action !== 'accept' && action !== 'reject') {
      res.status(400).json({ message: 'action must be accept or reject.' })
      return
    }

    const rows = await db.select().from(friendships).where(eq(friendships.id, req.params.id)).limit(1)
    const friendship = rows[0]
    if (!friendship) {
      res.status(404).json({ message: 'Request not found.' })
      return
    }
    if (friendship.addresseeId !== me.id) {
      res.status(403).json({ message: 'Only the addressee can respond to this request.' })
      return
    }
    if (friendship.status !== 'pending') {
      res.status(409).json({ message: 'This request is no longer pending.' })
      return
    }

    const [updated] = await db
      .update(friendships)
      .set({ status: action === 'accept' ? 'accepted' : 'rejected', updatedAt: new Date() })
      .where(eq(friendships.id, friendship.id))
      .returning()

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const rows = await db.select().from(friendships).where(eq(friendships.id, req.params.id)).limit(1)
    const friendship = rows[0]
    if (!friendship) {
      res.status(204).send()
      return
    }
    if (friendship.requesterId !== me.id && friendship.addresseeId !== me.id) {
      res.status(403).json({ message: 'This friendship does not belong to you.' })
      return
    }

    await db.delete(friendships).where(eq(friendships.id, friendship.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
