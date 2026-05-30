import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { timetableBlocks } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import {
  getModuleData,
  getLessonsForSelection,
  MODULE_COLORS,
} from '../services/nusmodsService'
import { parseNusmodsShareUrl } from '../utils/nusmodsUrlParser'

const router = Router()

// ── GET /api/timetable ────────────────────────────────────────────────────────
// Returns all blocks for the authenticated user.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const blocks = await db
      .select()
      .from(timetableBlocks)
      .where(eq(timetableBlocks.userId, dbUser.id))

    res.json(blocks)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/timetable ───────────────────────────────────────────────────────
// Creates a single timetable block (used for custom blocks and manual module entry).
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const {
      moduleCode, lessonType, classNo,
      title, day, startTime, endTime, weeks,
      venue, source, color,
    } = req.body

    const [block] = await db
      .insert(timetableBlocks)
      .values({
        userId: dbUser.id,
        moduleCode: moduleCode ?? null,
        lessonType: lessonType ?? null,
        classNo:    classNo    ?? null,
        title,
        day,
        startTime,
        endTime,
        weeks:  weeks  ?? [1,2,3,4,5,6,7,8,9,10,11,12,13],
        venue:  venue  ?? null,
        source: source ?? 'custom',
        color:  color  ?? '#6366f1',
      })
      .returning()

    res.status(201).json(block)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/timetable/import ────────────────────────────────────────────────
// Imports a full timetable from a NUSMods share URL.
// Deletes existing NUSMods blocks for the same modules before inserting new ones,
// so re-importing a URL is idempotent.
router.post('/import', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const { shareUrl, year } = req.body as { shareUrl: string; year?: string }
    if (!shareUrl) {
      res.status(400).json({ message: 'shareUrl is required.' })
      return
    }

    const parsed     = parseNusmodsShareUrl(shareUrl)
    const academicYear = year ?? process.env.NUSMODS_ACADEMIC_YEAR ?? '2024-2025'

    // Find which colours are already taken by existing modules
    const existingBlocks = await db
      .select({ moduleCode: timetableBlocks.moduleCode, color: timetableBlocks.color })
      .from(timetableBlocks)
      .where(eq(timetableBlocks.userId, dbUser.id))

    const colorMap = new Map<string, string>()
    for (const b of existingBlocks) {
      if (b.moduleCode) colorMap.set(b.moduleCode, b.color)
    }

    const createdBlocks = []

    for (const { moduleCode, selections } of parsed.modules) {
      // Assign a colour if this module is new
      if (!colorMap.has(moduleCode)) {
        colorMap.set(moduleCode, MODULE_COLORS[colorMap.size % MODULE_COLORS.length])
      }
      const color = colorMap.get(moduleCode)!

      const moduleData = await getModuleData(moduleCode, parsed.semester, academicYear)

      // Remove existing NUSMods blocks for this module+semester before re-importing
      await db
        .delete(timetableBlocks)
        .where(
          and(
            eq(timetableBlocks.userId,     dbUser.id),
            eq(timetableBlocks.moduleCode, moduleCode),
            eq(timetableBlocks.source,     'nusmods')
          )
        )

      for (const { lessonType, classNo } of selections) {
        const lessons = getLessonsForSelection(moduleData, parsed.semester, lessonType, classNo)

        for (const lesson of lessons) {
          const [block] = await db
            .insert(timetableBlocks)
            .values({
              userId:     dbUser.id,
              moduleCode,
              lessonType: lesson.lessonType,
              classNo:    lesson.classNo,
              title:      `${moduleCode} ${lesson.lessonType}`,
              day:        lesson.day,
              startTime:  lesson.startTime,
              endTime:    lesson.endTime,
              weeks:      lesson.weeks,
              venue:      lesson.venue || null,
              source:     'nusmods',
              color,
            })
            .returning()

          createdBlocks.push(block)
        }
      }
    }

    res.status(201).json(createdBlocks)
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/timetable/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    await db
      .delete(timetableBlocks)
      .where(
        and(
          eq(timetableBlocks.id,     req.params.id),
          eq(timetableBlocks.userId, dbUser.id)
        )
      )

    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/timetable/module/:moduleCode ──────────────────────────────────
// Removes all NUSMods blocks for an entire module (used by "remove module" button).
router.delete('/module/:moduleCode', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    await db
      .delete(timetableBlocks)
      .where(
        and(
          eq(timetableBlocks.userId,     dbUser.id),
          eq(timetableBlocks.moduleCode, req.params.moduleCode),
          eq(timetableBlocks.source,     'nusmods')
        )
      )

    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── PUT /api/timetable/:id ────────────────────────────────────────────────────
// Updates a custom block (NUSMods blocks are replaced via re-import, not edited).
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const { title, day, startTime, endTime, weeks, venue, color } = req.body

    // Any block can be edited (NUSMods or custom) — the user may need to
    // override times or venues that NUSMods imported incorrectly.
    const [updated] = await db
      .update(timetableBlocks)
      .set({ title, day, startTime, endTime, weeks, venue, color })
      .where(
        and(
          eq(timetableBlocks.id,     req.params.id),
          eq(timetableBlocks.userId, dbUser.id)
        )
      )
      .returning()

    if (!updated) {
      res.status(404).json({ message: 'Block not found.' })
      return
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
