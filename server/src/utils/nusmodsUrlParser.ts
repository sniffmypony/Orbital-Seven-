// Parses a NUSMods share URL into structured module selections.
//
// Supports both URL formats NUSMods has used:
//
// Old format (pre-2024):
//   CS2030S=LAB:05,REC:06,TUT:07
//   Comma-separated lesson types, no parentheses around class numbers.
//
// New format (2024+):
//   CS2030S=LAB:(1);REC:(24);LEC:(44)
//   Semicolon-separated lesson types, class numbers in parentheses.
//   Multiple class numbers for one lesson type use commas inside the parens:
//     MA1522=LEC:(1,3)   → two lecture slots, class 1 and class 3
//     MA2104=LEC:(7,11)  → two lecture slots, class 7 and class 11
//   Modules with no selections are allowed (e.g. CFG1004=) and are skipped.

export interface LessonSelection {
  lessonType: string
  classNo: string
}

export interface ParsedModule {
  moduleCode: string
  selections: LessonSelection[]
}

export interface ParsedShareUrl {
  semester: number
  modules: ParsedModule[]
}

export function parseNusmodsShareUrl(url: string): ParsedShareUrl {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw new Error('Invalid URL format.')
  }

  // Extract semester from path: /timetable/sem-1/share or /timetable/sem-2/share
  const semMatch = parsed.pathname.match(/sem-(\d)/)
  if (!semMatch) {
    throw new Error(
      'URL does not look like a NUSMods share link. ' +
      'Expected a path like /timetable/sem-1/share.'
    )
  }
  const semester = parseInt(semMatch[1], 10)

  const modules: ParsedModule[] = []

  parsed.searchParams.forEach((value, moduleCode) => {
    if (!moduleCode) return
    // Skip modules with no lesson selections (e.g. "CFG1004=")
    if (!value.trim()) return

    const selections: LessonSelection[] = []

    // Detect format by presence of parentheses or semicolons (new format)
    // vs plain comma-separated pairs (old format).
    const isNewFormat = value.includes('(') || value.includes(';')

    if (isNewFormat) {
      // Split on semicolons to get one segment per lesson type.
      // e.g. "LAB:(1);REC:(24);LEC:(44)" → ["LAB:(1)", "REC:(24)", "LEC:(44)"]
      const parts = value.split(';').filter(Boolean)

      for (const part of parts) {
        const colonIdx = part.indexOf(':')
        if (colonIdx === -1) {
          throw new Error(`Malformed selection "${part}" for module ${moduleCode}.`)
        }

        const lessonType = part.slice(0, colonIdx).trim()
        const raw        = part.slice(colonIdx + 1).trim()

        // Strip surrounding parentheses: "(1,3)" → "1,3", "(1)" → "1"
        const inner = raw.replace(/^\(|\)$/g, '')

        // A comma inside the parens means multiple class numbers for this
        // lesson type (e.g. two lecture slots from different timetable groups).
        const classNos = inner.split(',').map((s) => s.trim()).filter(Boolean)
        for (const classNo of classNos) {
          selections.push({ lessonType, classNo })
        }
      }
    } else {
      // Old format: "LAB:05,REC:06,TUT:07" — comma separates lesson types.
      const parts = value.split(',').filter(Boolean)
      for (const part of parts) {
        const colonIdx = part.indexOf(':')
        if (colonIdx === -1) {
          throw new Error(`Malformed selection "${part}" for module ${moduleCode}.`)
        }
        selections.push({
          lessonType: part.slice(0, colonIdx).trim(),
          classNo:    part.slice(colonIdx + 1).trim(),
        })
      }
    }

    if (selections.length > 0) {
      modules.push({ moduleCode: moduleCode.toUpperCase(), selections })
    }
  })

  if (modules.length === 0) {
    throw new Error('No modules found in the share URL.')
  }

  return { semester, modules }
}
