

export function timeToMinutes(time: string): number {
  const h = parseInt(time.slice(0, 2), 10)
  const m = parseInt(time.slice(2, 4), 10)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}${m}`
}

export function formatTimeDisplay(time: string): string {
  const h = parseInt(time.slice(0, 2), 10)
  const m = time.slice(2, 4)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${m} ${period}`
}

export function blocksOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  const aStart = timeToMinutes(a.startTime)
  const aEnd   = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd   = timeToMinutes(b.endTime)
  return aStart < bEnd && aEnd > bStart
}
