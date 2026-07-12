import { timetableBlocks } from '../db/schema'

type BlockRow = typeof timetableBlocks.$inferSelect

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const WINDOW_START = 8 * 60
const WINDOW_END = 22 * 60
const DEFAULT_MIN = 30

function toMinutes(t: string): number {
  return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10)
}

function toHHMM(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return String(h).padStart(2, '0') + String(mm).padStart(2, '0')
}

export interface AvailabilitySlot {
  day: string
  start: string
  end: string
  freeCount: number
  totalCount: number
  busyNames: string[]
}

export interface Participant {
  id: string
  name: string
}

export function computeGroupAvailability(
  participants: Participant[],
  blocksByUser: BlockRow[][],
  minMinutes = DEFAULT_MIN
): { everyoneFree: AvailabilitySlot[]; bestSlots: AvailabilitySlot[] } {
  const total = participants.length
  const segments: AvailabilitySlot[] = []

  for (const day of DAYS) {
    const dayIntervals = blocksByUser.map((blocks) =>
      blocks
        .filter((b) => b.day === day)
        .map((b) => [Math.max(WINDOW_START, toMinutes(b.startTime)), Math.min(WINDOW_END, toMinutes(b.endTime))] as [number, number])
        .filter(([s, e]) => e > s)
    )

    const boundarySet = new Set<number>([WINDOW_START, WINDOW_END])
    for (const ivs of dayIntervals) {
      for (const [s, e] of ivs) {
        if (s > WINDOW_START && s < WINDOW_END) boundarySet.add(s)
        if (e > WINDOW_START && e < WINDOW_END) boundarySet.add(e)
      }
    }
    const boundaries = Array.from(boundarySet).sort((a, b) => a - b)

    const raw: AvailabilitySlot[] = []
    for (let i = 0; i < boundaries.length - 1; i++) {
      const a = boundaries[i]
      const b = boundaries[i + 1]
      const mid = (a + b) / 2
      const busyNames: string[] = []
      dayIntervals.forEach((ivs, idx) => {
        const busy = ivs.some(([s, e]) => mid >= s && mid < e)
        if (busy) busyNames.push(participants[idx].name)
      })
      raw.push({ day, start: toHHMM(a), end: toHHMM(b), freeCount: total - busyNames.length, totalCount: total, busyNames })
    }

    for (const seg of raw) {
      const last = segments[segments.length - 1]
      if (
        last &&
        last.day === day &&
        last.end === seg.start &&
        last.busyNames.length === seg.busyNames.length &&
        last.busyNames.every((n) => seg.busyNames.includes(n))
      ) {
        last.end = seg.end
      } else {
        segments.push({ ...seg })
      }
    }
  }

  const durationOf = (s: AvailabilitySlot) => toMinutes(s.end) - toMinutes(s.start)
  const sized = segments.filter((s) => durationOf(s) >= minMinutes)

  const everyoneFree = sized.filter((s) => s.busyNames.length === 0)

  const bestSlots = [...sized]
    .sort((a, b) => b.freeCount - a.freeCount || durationOf(b) - durationOf(a))
    .slice(0, 3)

  return { everyoneFree, bestSlots }
}

export interface OverlapBusyEntry {
  name: string
  title: string
  venue: string | null
}

export interface OverlapSegment {
  start: string
  end: string
  busy: OverlapBusyEntry[]
}

export function computeGroupOverlap(
  participants: Participant[],
  blocksByUser: BlockRow[][]
): Record<string, OverlapSegment[]> {
  const result: Record<string, OverlapSegment[]> = {}

  const keyOf = (list: OverlapBusyEntry[]) =>
    list.map((w) => `${w.name}|${w.title}|${w.venue ?? ''}`).sort().join(';')

  for (const day of DAYS) {
    const entries: Array<{ s: number; e: number; who: OverlapBusyEntry }> = []
    blocksByUser.forEach((blocks, idx) => {
      for (const b of blocks) {
        if (b.day !== day) continue
        const s = Math.max(WINDOW_START, toMinutes(b.startTime))
        const e = Math.min(WINDOW_END, toMinutes(b.endTime))
        if (e > s) {
          entries.push({ s, e, who: { name: participants[idx].name, title: b.title, venue: b.venue } })
        }
      }
    })

    const boundarySet = new Set<number>([WINDOW_START, WINDOW_END])
    for (const en of entries) {
      if (en.s > WINDOW_START && en.s < WINDOW_END) boundarySet.add(en.s)
      if (en.e > WINDOW_START && en.e < WINDOW_END) boundarySet.add(en.e)
    }
    const boundaries = Array.from(boundarySet).sort((a, b) => a - b)

    const segments: OverlapSegment[] = []
    for (let i = 0; i < boundaries.length - 1; i++) {
      const a = boundaries[i]
      const b = boundaries[i + 1]
      const mid = (a + b) / 2
      const busy = entries.filter((en) => mid >= en.s && mid < en.e).map((en) => en.who)

      const last = segments[segments.length - 1]
      if (last && last.end === toHHMM(a) && keyOf(last.busy) === keyOf(busy)) {
        last.end = toHHMM(b)
      } else {
        segments.push({ start: toHHMM(a), end: toHHMM(b), busy })
      }
    }

    result[day] = segments
  }

  return result
}
