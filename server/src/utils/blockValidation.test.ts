import { validateBlockShape, isValidTime } from './blockValidation'

describe('isValidTime', () => {
  it('accepts 4-digit 24-hour times', () => {
    expect(isValidTime('0000')).toBe(true)
    expect(isValidTime('0930')).toBe(true)
    expect(isValidTime('2359')).toBe(true)
  })

  it('rejects malformed values', () => {
    expect(isValidTime('930')).toBe(false)
    expect(isValidTime('09:30')).toBe(false)
    expect(isValidTime('2400')).toBe(false)
    expect(isValidTime('0960')).toBe(false)
    expect(isValidTime('abcd')).toBe(false)
    expect(isValidTime(930)).toBe(false)
    expect(isValidTime(undefined)).toBe(false)
  })
})

describe('validateBlockShape', () => {
  it('accepts an ordinary daytime block', () => {
    expect(validateBlockShape({ day: 'Monday', startTime: '0900', endTime: '1100' })).toBeNull()
  })

  it('accepts a block that runs past midnight', () => {
    expect(validateBlockShape({ day: 'Friday', startTime: '2300', endTime: '0100' })).toBeNull()
  })

  it('accepts a block ending exactly at 2am', () => {
    expect(validateBlockShape({ day: 'Friday', startTime: '2300', endTime: '0200' })).toBeNull()
  })

  it('rejects an unknown day', () => {
    expect(validateBlockShape({ day: 'Funday', startTime: '0900', endTime: '1000' })).toMatch(/day/)
  })

  it('rejects malformed times', () => {
    expect(validateBlockShape({ day: 'Monday', startTime: '9am', endTime: '1000' })).toMatch(/24-hour/)
  })

  it('rejects an end time at or before the start time', () => {
    expect(validateBlockShape({ day: 'Monday', startTime: '1100', endTime: '1100' })).toMatch(/after/)
    expect(validateBlockShape({ day: 'Monday', startTime: '1100', endTime: '1000' })).toMatch(/after/)
  })

  it('rejects a start time before 8am', () => {
    expect(validateBlockShape({ day: 'Monday', startTime: '0700', endTime: '0900' })).toMatch(/8:00 AM/)
  })

  it('rejects an end time past 2am', () => {
    expect(validateBlockShape({ day: 'Monday', startTime: '2300', endTime: '0300' })).toMatch(/8:00 AM/)
  })

  it('rejects missing fields', () => {
    expect(validateBlockShape({})).not.toBeNull()
    expect(validateBlockShape({ day: 'Monday' })).not.toBeNull()
  })
})
