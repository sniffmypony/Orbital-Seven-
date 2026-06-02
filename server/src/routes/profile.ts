import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'

const router = Router()

const DEFAULT_VISIBILITY_VALUES = ['private', 'friends']

function publicProfile(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    major: u.major,
    defaultBlockVisibility: u.defaultBlockVisibility,
  }
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    res.json(publicProfile(me))
  } catch (err) {
    next(err)
  }
})

router.patch('/', requireAuth, async (req, res, next) => {
  try {
    const me = await getOrCreateDbUser(getClerkUserId(req))
    const { displayName, bio, major, defaultBlockVisibility } = req.body as {
      displayName?: string
      bio?: string
      major?: string
      defaultBlockVisibility?: string
    }

    const updateSet: Record<string, unknown> = { updatedAt: new Date() }

    if (typeof displayName === 'string' && displayName.trim()) {
      updateSet.displayName = displayName.trim()
    }
    if (typeof bio === 'string') {
      updateSet.bio = bio.trim() || null
    }
    if (typeof major === 'string') {
      updateSet.major = major.trim() || null
    }
    if (typeof defaultBlockVisibility === 'string' && DEFAULT_VISIBILITY_VALUES.includes(defaultBlockVisibility)) {
      updateSet.defaultBlockVisibility = defaultBlockVisibility
    }

    const [updated] = await db
      .update(users)
      .set(updateSet)
      .where(eq(users.id, me.id))
      .returning()

    res.json(publicProfile(updated))
  } catch (err) {
    next(err)
  }
})

export default router
