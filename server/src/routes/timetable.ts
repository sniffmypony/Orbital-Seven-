import { Router } from 'express'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { timetableBlocks, timetableBlockVisibility } from '../db/schema'
import { requireAuth, getClerkUserId } from '../middleware/auth'
import { getOrCreateDbUser } from '../services/userService'
import {
  getModuleData,
  getLessonsForSelection,
  expandLessonType,
  MODULE_COLORS,
} from '../services/nusmodsService'
import { parseNusmodsShareUrl } from '../utils/nusmodsUrlParser'

const router = Router()

const VISIBILITY_VALUES = ['private', 'friends', 'only', 'except']

type BlockRow = typeof timetableBlocks.$inferSelect

async function attachVisibleTo(blocks: BlockRow[]) {
  const overrideIds = blocks
    .filter((b) => b.visibility === 'only' || b.visibility === 'except')
    .map((b) => b.id)

  const byBlock = new Map<string, string[]>()
  if (overrideIds.length > 0) {
    const rows = await db
      .select()
      .from(timetableBlockVisibility)
      .where(inArray(timetableBlockVisibility.blockId, overrideIds))
    for (const r of rows) {
      const list = byBlock.get(r.blockId) ?? []
      list.push(r.userId)
      byBlock.set(r.blockId, list)
    }
  }

  return blocks.map((b) => ({ ...b, visibleTo: byBlock.get(b.id) ?? [] }))
}

async function setBlockOverrides(blockId: string, visibility: string, visibleTo: unknown) {
  await db.delete(timetableBlockVisibility).where(eq(timetableBlockVisibility.blockId, blockId))

  if ((visibility === 'only' || visibility === 'except') && Array.isArray(visibleTo)) {
    const ids = visibleTo.filter((v): v is string => typeof v === 'string')
    if (ids.length > 0) {
      await db
        .insert(timetableBlockVisibility)
        .values(ids.map((userId) => ({ blockId, userId })))
        .onConflictDoNothing()
    }
  }
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const blocks = await db
      .select()
      .from(timetableBlocks)
      .where(eq(timetableBlocks.userId, dbUser.id))

    res.json(await attachVisibleTo(blocks))
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const {
      moduleCode, lessonType, classNo,
      title, day, startTime, endTime, weeks,
      venue, note, source, color, visibility, visibleTo,
    } = req.body

    const resolvedVisibility = VISIBILITY_VALUES.includes(visibility) ? visibility : dbUser.defaultBlockVisibility

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
        note:   note   ?? null,
        source: source ?? 'custom',
        color:  color  ?? '#6366f1',
        visibility: resolvedVisibility,
      })
      .returning()

    await setBlockOverrides(block.id, resolvedVisibility, visibleTo)

    res.status(201).json({ ...block, visibleTo: Array.isArray(visibleTo) ? visibleTo : [] })
  } catch (err) {
    next(err)
  }
})

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

    const existingBlocks = await db
      .select({ moduleCode: timetableBlocks.moduleCode, color: timetableBlocks.color })
      .from(timetableBlocks)
      .where(eq(timetableBlocks.userId, dbUser.id))

    const colorMap = new Map<string, string>()
    for (const b of existingBlocks) {
      if (b.moduleCode) colorMap.set(b.moduleCode, b.color)
    }

    const createdBlocks = []
    const failed: Array<{
      moduleCode: string
      lessonType: string
      lessonLabel: string
      classNo: string
      reason: 'not_found' | 'no_match'
      color: string
    }> = []

    for (const { moduleCode, selections } of parsed.modules) {

      if (!colorMap.has(moduleCode)) {
        colorMap.set(moduleCode, MODULE_COLORS[colorMap.size % MODULE_COLORS.length])
      }
      const color = colorMap.get(moduleCode)!

      let moduleData
      try {
        moduleData = await getModuleData(moduleCode, parsed.semester, academicYear)
      } catch {
        for (const { lessonType, classNo } of selections) {
          failed.push({ moduleCode, lessonType, lessonLabel: expandLessonType(lessonType), classNo, reason: 'not_found', color })
        }
        continue
      }

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

        if (lessons.length === 0) {
          failed.push({ moduleCode, lessonType, lessonLabel: expandLessonType(lessonType), classNo, reason: 'no_match', color })
          continue
        }

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
              visibility: dbUser.defaultBlockVisibility,
            })
            .returning()

          createdBlocks.push(block)
        }
      }
    }

    const importedModules = new Set(createdBlocks.map((b) => b.moduleCode))
    const unresolvedFailed = failed.filter((f) => !importedModules.has(f.moduleCode))

    res.status(201).json({
      created: createdBlocks,
      imported: createdBlocks.length,
      failed: unresolvedFailed,
      academicYear,
    })
  } catch (err) {
    next(err)
  }
})

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

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const clerkId = getClerkUserId(req)
    const dbUser  = await getOrCreateDbUser(clerkId)

    const { title, day, startTime, endTime, weeks, venue, note, color, visibility, visibleTo } = req.body

    const updateSet: Record<string, unknown> = { title, day, startTime, endTime, weeks, venue, color }
    if (note !== undefined) {
      updateSet.note = typeof note === 'string' && note.trim() ? note.trim() : null
    }
    if (VISIBILITY_VALUES.includes(visibility)) {
      updateSet.visibility = visibility
    }

    const [updated] = await db
      .update(timetableBlocks)
      .set(updateSet)
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

    if (VISIBILITY_VALUES.includes(visibility)) {
      await setBlockOverrides(updated.id, visibility, visibleTo)
    }

    res.json({ ...updated, visibleTo: Array.isArray(visibleTo) ? visibleTo : [] })
  } catch (err) {
    next(err)
  }
})

export default router
