import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { nusmodsCache } from '../db/schema'

const ACADEMIC_YEAR = process.env.NUSMODS_ACADEMIC_YEAR ?? '2025-2026'
const NUSMODS_BASE  = `https://api.nusmods.com/v2`

// ── Lesson-type normalisation ────────────────────────────────────────────────
// NUSMods share URLs use short codes (LEC, TUT, LAB, …) but the NUSMods API
// returns full English names ("Lecture", "Tutorial", "Laboratory", …).
// expandLessonType converts a URL code to the API name so that
// getLessonsForSelection can match correctly.
const LESSON_TYPE_MAP: Record<string, string> = {
  LEC:   'Lecture',
  TUT:   'Tutorial',
  LAB:   'Laboratory',
  REC:   'Recitation',
  SEC:   'Sectional Teaching',
  DLEC:  'Design Lecture',
  PLEC:  'Packaged Lecture',
  PTUT:  'Packaged Tutorial',
  SEM:   'Seminar',
  WS:    'Workshop',
  WKSHP: 'Workshop',
  MINI:  'Mini-Project',
  PROJ:  'Project',
  DEMO:  'Demonstration',
  PLEN:  'Plenary',
  RVST:  'Rehearsal / Studio',
}

export function expandLessonType(code: string): string {
  return LESSON_TYPE_MAP[code.toUpperCase()] ?? code
}

// Colour palette for auto-assigning module colours
export const MODULE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
]

export interface NusmodsLesson {
  classNo:    string
  startTime:  string
  endTime:    string
  weeks:      number[]
  venue:      string
  day:        string
  lessonType: string
}

export interface NusmodsModuleData {
  moduleCode:   string
  title:        string
  semesterData: Array<{
    semester: number
    timetable: NusmodsLesson[]
  }>
}

// Returns full module data, hitting the DB cache before calling NUSMods.
export async function getModuleData(
  moduleCode: string,
  semester: number,
  year = ACADEMIC_YEAR
): Promise<NusmodsModuleData> {
  const code = moduleCode.toUpperCase()

  // Check cache
  const cached = await db
    .select()
    .from(nusmodsCache)
    .where(
      and(
        eq(nusmodsCache.moduleCode,   code),
        eq(nusmodsCache.academicYear, year),
        eq(nusmodsCache.semester,     semester)
      )
    )
    .limit(1)

  if (cached.length > 0) return cached[0].data as NusmodsModuleData

  // Fetch from NUSMods
  const res = await fetch(`${NUSMODS_BASE}/${year}/modules/${code}.json`)
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Module ${code} not found on NUSMods.`)
    throw new Error(`NUSMods API error: ${res.status}`)
  }

  const data: NusmodsModuleData = await res.json()

  // Persist to cache (upsert — ignore conflict on duplicate key)
  await db
    .insert(nusmodsCache)
    .values({ moduleCode: code, academicYear: year, semester, data })
    .onConflictDoUpdate({
      target: [nusmodsCache.moduleCode, nusmodsCache.academicYear, nusmodsCache.semester],
      set: { data, cachedAt: new Date() },
    })

  return data
}

// Returns all lessons for a specific semester, grouped by lessonType.
export function groupLessonsByType(
  moduleData: NusmodsModuleData,
  semester: number
): Record<string, NusmodsLesson[]> {
  const semData = moduleData.semesterData.find((s) => s.semester === semester)
  if (!semData) throw new Error(`Module ${moduleData.moduleCode} not available in Semester ${semester}.`)

  return semData.timetable.reduce<Record<string, NusmodsLesson[]>>((acc, lesson) => {
    if (!acc[lesson.lessonType]) acc[lesson.lessonType] = []
    acc[lesson.lessonType].push(lesson)
    return acc
  }, {})
}

// Finds all lesson entries for a specific (lessonType, classNo) selection.
// A single selection can map to multiple entries (e.g. a tutorial that meets twice a week).
//
// lessonType may be a URL abbreviation ("LEC") or already a full API name ("Lecture").
// expandLessonType handles the normalisation so both forms match correctly.
export function getLessonsForSelection(
  moduleData: NusmodsModuleData,
  semester: number,
  lessonType: string,
  classNo: string
): NusmodsLesson[] {
  const semData = moduleData.semesterData.find((s) => s.semester === semester)
  if (!semData) return []

  const expanded    = expandLessonType(lessonType)  // e.g. "LEC" → "Lecture"
  const normalize   = (s: string) => s.replace(/^0+/, '') || '0'   // "01" → "1"
  const targetClass = normalize(classNo)

  return semData.timetable.filter(
    (l) =>
      (l.lessonType === expanded || l.lessonType === lessonType) &&
      normalize(l.classNo) === targetClass
  )
}
