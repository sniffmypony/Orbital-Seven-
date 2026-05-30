import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getModuleData, groupLessonsByType } from '../services/nusmodsService'

const router = Router()

// GET /api/nusmods/module/:code?semester=1&year=2024-2025
// Returns module metadata + timetable grouped by lesson type.
router.get('/module/:code', requireAuth, async (req, res, next) => {
  try {
    const { code }   = req.params
    const semester   = parseInt(req.query.semester as string) || 1
    const year       = (req.query.year as string) || process.env.NUSMODS_ACADEMIC_YEAR || '2024-2025'

    const moduleData = await getModuleData(code, semester, year)
    const grouped    = groupLessonsByType(moduleData, semester)

    res.json({
      moduleCode:  moduleData.moduleCode,
      title:       moduleData.title,
      semester,
      lessonTypes: grouped,
    })
  } catch (err) {
    next(err)
  }
})

export default router
