

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

    if (!value.trim()) return

    const selections: LessonSelection[] = []

    const isNewFormat = value.includes('(') || value.includes(';')

    if (isNewFormat) {

      const parts = value.split(';').filter(Boolean)

      for (const part of parts) {
        const colonIdx = part.indexOf(':')
        if (colonIdx === -1) {
          throw new Error(`Malformed selection "${part}" for module ${moduleCode}.`)
        }

        const lessonType = part.slice(0, colonIdx).trim()
        const raw        = part.slice(colonIdx + 1).trim()

        const inner = raw.replace(/^\(|\)$/g, '')

        const classNos = inner.split(',').map((s) => s.trim()).filter(Boolean)
        for (const classNo of classNos) {
          selections.push({ lessonType, classNo })
        }
      }
    } else {

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
