import { timetableBlocks } from '../db/schema'

type BlockRow = typeof timetableBlocks.$inferSelect

export const FREE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const WINDOW_START = 8 * 60
const WINDOW_END = 22 * 60

function toMinutes(t: string): number {
  return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10)
}

function toHHMM(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return String(h).padStart(2, '0') + String(mm).padStart(2, '0')
}

export interface FreeSlot {
  start: string
  end: string
}

export function computeGroupFreeSlots(
  blocksByUser: BlockRow[][],
  minMinutes = 0
): Record<string, FreeSlot[]> {
  const result: Record<string, FreeSlot[]> = {}

  for (const day of FREE_DAYS) {
    const intervals: Array<[number, number]> = []
    for (const blocks of blocksByUser) {
      for (const b of blocks) {
        if (b.day !== day) continue
        const s = Math.max(WINDOW_START, toMinutes(b.startTime))
        const e = Math.min(WINDOW_END, toMinutes(b.endTime))
        if (e > s) intervals.push([s, e])
      }
    }

    intervals.sort((a, b) => a[0] - b[0])

    const merged: Array<[number, number]> = []
    for (const iv of intervals) {
      const last = merged[merged.length - 1]
      if (last && iv[0] <= last[1]) {
        last[1] = Math.max(last[1], iv[1])
      } else {
        merged.push([iv[0], iv[1]])
      }
    }

    const free: FreeSlot[] = []
    let cursor = WINDOW_START
    for (const [s, e] of merged) {
      if (s - cursor >= minMinutes && s > cursor) {
        free.push({ start: toHHMM(cursor), end: toHHMM(s) })
      }
      cursor = Math.max(cursor, e)
    }
    if (WINDOW_END - cursor >= minMinutes && cursor < WINDOW_END) {
      free.push({ start: toHHMM(cursor), end: toHHMM(WINDOW_END) })
    }

    result[day] = free
  }

  return result
}
