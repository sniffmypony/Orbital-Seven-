// Client-side time utilities (mirrors server/src/utils/timeBlocks.ts)

export function timeToMinutes(time: string): number {
  return parseInt(time.slice(0, 2), 10) * 60 + parseInt(time.slice(2, 4), 10)
}

export function formatTimeDisplay(time: string): string {
  const h      = parseInt(time.slice(0, 2), 10)
  const m      = time.slice(2, 4)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m} ${period}`
}
