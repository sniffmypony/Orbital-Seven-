import { timeToMinutes, minutesToTime, formatTimeDisplay, blocksOverlap } from './timeBlocks'

describe('timeToMinutes', () => {
  it('converts 0800 to 480', () => expect(timeToMinutes('0800')).toBe(480))
  it('converts 1400 to 840', () => expect(timeToMinutes('1400')).toBe(840))
  it('converts 0000 to 0',   () => expect(timeToMinutes('0000')).toBe(0))
  it('converts 2359 to 1439', () => expect(timeToMinutes('2359')).toBe(1439))
})

describe('minutesToTime', () => {
  it('converts 480 to 0800',  () => expect(minutesToTime(480)).toBe('0800'))
  it('converts 840 to 1400',  () => expect(minutesToTime(840)).toBe('1400'))
  it('round-trips correctly', () => {
    expect(minutesToTime(timeToMinutes('1230'))).toBe('1230')
  })
})

describe('formatTimeDisplay', () => {
  it('formats 0800 as 8:00 AM',  () => expect(formatTimeDisplay('0800')).toBe('8:00 AM'))
  it('formats 1200 as 12:00 PM', () => expect(formatTimeDisplay('1200')).toBe('12:00 PM'))
  it('formats 1400 as 2:00 PM',  () => expect(formatTimeDisplay('1400')).toBe('2:00 PM'))
  it('formats 0000 as 12:00 AM', () => expect(formatTimeDisplay('0000')).toBe('12:00 AM'))
})

describe('blocksOverlap', () => {
  const a = { startTime: '1000', endTime: '1200' }

  it('detects overlap', () =>
    expect(blocksOverlap(a, { startTime: '1100', endTime: '1300' })).toBe(true))

  it('detects no overlap — block after', () =>
    expect(blocksOverlap(a, { startTime: '1200', endTime: '1400' })).toBe(false))

  it('detects no overlap — block before', () =>
    expect(blocksOverlap(a, { startTime: '0800', endTime: '1000' })).toBe(false))

  it('detects containment', () =>
    expect(blocksOverlap(a, { startTime: '1030', endTime: '1130' })).toBe(true))
})
