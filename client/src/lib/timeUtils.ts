

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

const DAY_START_MIN  = 8 * 60
const DAY_END_MIN    = 22 * 60
const NIGHT_END_MIN  = 26 * 60

function effectiveMinutes(min: number, nightOwl: boolean): number {
  return nightOwl && min < DAY_START_MIN ? min + 1440 : min
}

export function validateBlockTimes(start: string, end: string, nightOwl: boolean): string | null {
  const s = effectiveMinutes(timeToMinutes(start), nightOwl)
  const e = effectiveMinutes(timeToMinutes(end), nightOwl)

  const limit = nightOwl ? NIGHT_END_MIN : DAY_END_MIN
  const outOfRange = nightOwl
    ? 'In Night Owl mode, time slots must be between 8:00 AM and 2:00 AM.'
    : 'Without Night Owl mode, time slots must be between 8:00 AM and 10:00 PM.'

  if (s < DAY_START_MIN) {
    return 'Start time must be from 8:00 AM onwards.'
  }
  if (s > limit || e > limit) {
    return outOfRange
  }
  if (e <= s) {
    return 'End time must be after the start time.'
  }
  return null
}
