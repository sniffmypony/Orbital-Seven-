import { Router } from 'express'
import { inArray } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import { areFriends } from '../services/friendService'
import { getVisibleBlocks } from '../services/timetableService'
import { computeGroupFreeSlots } from '../services/freeTimeService'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))

    const raw = String(req.query.friendIds ?? '').trim()
    const requestedIds = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
    const minMinutes = Number(req.query.minMinutes ?? 0) || 0

    const friendIds: string[] = []
    for (const id of requestedIds) {
      if (id === me.id) continue
      if (friendIds.includes(id)) continue
      if (await areFriends(me.id, id)) friendIds.push(id)
    }

    const myBlocks = await getVisibleBlocks(me.id, me.id)
    const blocksByUser = [myBlocks]
    for (const fid of friendIds) {
      blocksByUser.push(await getVisibleBlocks(fid, me.id))
    }

    const days = computeGroupFreeSlots(blocksByUser, minMinutes)

    const participantIds = [me.id, ...friendIds]
    const participantRows = await db.select().from(users).where(inArray(users.id, participantIds))
    const userMap = new Map(participantRows.map((u) => [u.id, u]))
    const participants = participantIds.map((id) => {
      const u = userMap.get(id)!
      return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, isSelf: id === me.id }
    })

    res.json({ participants, days })
  } catch (err) {
    next(err)
  }
})

export default router
