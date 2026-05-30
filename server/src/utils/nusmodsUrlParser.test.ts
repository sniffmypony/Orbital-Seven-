import { parseNusmodsShareUrl } from './nusmodsUrlParser'

describe('parseNusmodsShareUrl — old format (pre-2024)', () => {
  const validUrl =
    'https://nusmods.com/timetable/sem-1/share?CS2030S=LAB:05,REC:06,TUT:07&CS2040S=LEC:1,TUT:10'

  it('extracts semester', () => {
    expect(parseNusmodsShareUrl(validUrl).semester).toBe(1)
  })

  it('extracts both modules', () => {
    const { modules } = parseNusmodsShareUrl(validUrl)
    expect(modules).toHaveLength(2)
    expect(modules[0].moduleCode).toBe('CS2030S')
    expect(modules[1].moduleCode).toBe('CS2040S')
  })

  it('extracts all lesson selections for a module', () => {
    const { modules } = parseNusmodsShareUrl(validUrl)
    expect(modules[0].selections).toEqual([
      { lessonType: 'LAB', classNo: '05' },
      { lessonType: 'REC', classNo: '06' },
      { lessonType: 'TUT', classNo: '07' },
    ])
  })
})

describe('parseNusmodsShareUrl — new format (2024+, semicolons + parentheses)', () => {
  // Mirrors a real NUSMods sem-2 share URL with the new format
  const newFormatUrl =
    'https://nusmods.com/timetable/sem-2/share?' +
    'CFG1004=&CS2030S=LAB:(1);REC:(24);LEC:(44)&HSH1000=TUT:(34)' +
    '&MA1522=LEC:(1,3)&MA2104=TUT:(6);LEC:(7,11)&RVX1005=SEC:(1)&ST1131=TUT:(1);LEC:(8)'

  it('extracts semester 2', () => {
    expect(parseNusmodsShareUrl(newFormatUrl).semester).toBe(2)
  })

  it('skips modules with no selections (e.g. CFG1004=)', () => {
    const { modules } = parseNusmodsShareUrl(newFormatUrl)
    expect(modules.find((m) => m.moduleCode === 'CFG1004')).toBeUndefined()
  })

  it('parses single class number in parens', () => {
    const { modules } = parseNusmodsShareUrl(newFormatUrl)
    const hsh = modules.find((m) => m.moduleCode === 'HSH1000')!
    expect(hsh.selections).toEqual([{ lessonType: 'TUT', classNo: '34' }])
  })

  it('expands comma-separated class numbers into separate selections', () => {
    // MA1522=LEC:(1,3) → two selections
    const { modules } = parseNusmodsShareUrl(newFormatUrl)
    const ma1522 = modules.find((m) => m.moduleCode === 'MA1522')!
    expect(ma1522.selections).toEqual([
      { lessonType: 'LEC', classNo: '1' },
      { lessonType: 'LEC', classNo: '3' },
    ])
  })

  it('handles mixed single and multi class numbers in one module', () => {
    // MA2104=TUT:(6);LEC:(7,11)
    const { modules } = parseNusmodsShareUrl(newFormatUrl)
    const ma2104 = modules.find((m) => m.moduleCode === 'MA2104')!
    expect(ma2104.selections).toEqual([
      { lessonType: 'TUT', classNo: '6'  },
      { lessonType: 'LEC', classNo: '7'  },
      { lessonType: 'LEC', classNo: '11' },
    ])
  })

  it('parses multiple lesson types separated by semicolons', () => {
    const { modules } = parseNusmodsShareUrl(newFormatUrl)
    const cs = modules.find((m) => m.moduleCode === 'CS2030S')!
    expect(cs.selections).toEqual([
      { lessonType: 'LAB', classNo: '1'  },
      { lessonType: 'REC', classNo: '24' },
      { lessonType: 'LEC', classNo: '44' },
    ])
  })
})

describe('parseNusmodsShareUrl — shared edge cases', () => {
  it('handles semester 2', () => {
    const url = 'https://nusmods.com/timetable/sem-2/share?CS2100=LEC:1'
    expect(parseNusmodsShareUrl(url).semester).toBe(2)
  })

  it('uppercases module codes', () => {
    const url = 'https://nusmods.com/timetable/sem-1/share?cs2030s=LEC:1'
    expect(parseNusmodsShareUrl(url).modules[0].moduleCode).toBe('CS2030S')
  })

  it('throws on non-NUSMods URL', () => {
    expect(() => parseNusmodsShareUrl('https://example.com/?CS1010=LEC:1')).toThrow()
  })

  it('throws when no modules have any selections', () => {
    // All modules empty → should throw
    expect(() =>
      parseNusmodsShareUrl('https://nusmods.com/timetable/sem-1/share?CFG1004=')
    ).toThrow('No modules found')
  })

  it('throws on completely invalid URL', () => {
    expect(() => parseNusmodsShareUrl('not a url')).toThrow()
  })
})
