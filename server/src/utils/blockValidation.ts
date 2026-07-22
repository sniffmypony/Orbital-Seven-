import { timeToMinutes } from './timeBlocks'

export const VALID_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

const DAY_START_MIN = 8 * 60
const NIGHT_END_MIN = 26 * 60

export function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) return false
  const h = parseInt(value.slice(0, 2), 10)
  const m = parseInt(value.slice(2, 4), 10)
  return h < 24 && m < 60
}

export function validateBlockShape(input: {
  day?: unknown
  startTime?: unknown
  endTime?: unknown
}): string | null {
  const { day, startTime, endTime } = input

  if (typeof day !== 'string' || !VALID_DAYS.includes(day)) {
    return 'day must be a valid day of the week.'
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return 'startTime and endTime must be 4-digit 24-hour times, for example 0930.'
  }

  const rawStart = timeToMinutes(startTime)
  const rawEnd = timeToMinutes(endTime)
  const start = rawStart < DAY_START_MIN ? rawStart + 1440 : rawStart
  const end = rawEnd < DAY_START_MIN ? rawEnd + 1440 : rawEnd

  if (start < DAY_START_MIN || start > NIGHT_END_MIN || end > NIGHT_END_MIN) {
    return 'Time slots must fall between 8:00 AM and 2:00 AM.'
  }
  if (end <= start) {
    return 'endTime must be after startTime.'
  }
  return null
}
