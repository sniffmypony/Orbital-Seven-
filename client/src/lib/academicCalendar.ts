

interface CalendarEntry {
  date:  string
  label: string | null
}

const CALENDAR: CalendarEntry[] = [

  { date: '2025-08-04', label: null },
  { date: '2025-08-11', label: 'Sem 1 Week 1' },
  { date: '2025-08-18', label: 'Sem 1 Week 2' },
  { date: '2025-08-25', label: 'Sem 1 Week 3' },
  { date: '2025-09-01', label: 'Sem 1 Week 4' },
  { date: '2025-09-08', label: 'Sem 1 Week 5' },
  { date: '2025-09-15', label: 'Sem 1 Week 6' },
  { date: '2025-09-20', label: 'Recess Week' },
  { date: '2025-09-29', label: 'Sem 1 Week 7' },
  { date: '2025-10-06', label: 'Sem 1 Week 8' },
  { date: '2025-10-13', label: 'Sem 1 Week 9' },
  { date: '2025-10-20', label: 'Sem 1 Week 10' },
  { date: '2025-10-27', label: 'Sem 1 Week 11' },
  { date: '2025-11-03', label: 'Sem 1 Week 12' },
  { date: '2025-11-10', label: 'Sem 1 Week 13' },
  { date: '2025-11-15', label: 'Reading Week' },
  { date: '2025-11-22', label: 'Examination Week' },
  { date: '2025-12-07', label: null },

  { date: '2026-01-12', label: 'Sem 2 Week 1' },
  { date: '2026-01-19', label: 'Sem 2 Week 2' },
  { date: '2026-01-26', label: 'Sem 2 Week 3' },
  { date: '2026-02-02', label: 'Sem 2 Week 4' },
  { date: '2026-02-09', label: 'Sem 2 Week 5' },
  { date: '2026-02-16', label: 'Sem 2 Week 6' },
  { date: '2026-02-21', label: 'Recess Week' },
  { date: '2026-03-02', label: 'Sem 2 Week 7' },
  { date: '2026-03-09', label: 'Sem 2 Week 8' },
  { date: '2026-03-16', label: 'Sem 2 Week 9' },
  { date: '2026-03-23', label: 'Sem 2 Week 10' },
  { date: '2026-03-30', label: 'Sem 2 Week 11' },
  { date: '2026-04-06', label: 'Sem 2 Week 12' },
  { date: '2026-04-13', label: 'Sem 2 Week 13' },
  { date: '2026-04-18', label: 'Reading Week' },
  { date: '2026-04-25', label: 'Examination Week' },
  { date: '2026-05-10', label: null },

  { date: '2026-05-11', label: 'Special Semester' },
  { date: '2026-08-02', label: null },

  { date: '2026-08-03', label: null },
  { date: '2026-08-10', label: 'Sem 1 Week 1' },
  { date: '2026-08-17', label: 'Sem 1 Week 2' },
  { date: '2026-08-24', label: 'Sem 1 Week 3' },
  { date: '2026-08-31', label: 'Sem 1 Week 4' },
  { date: '2026-09-07', label: 'Sem 1 Week 5' },
  { date: '2026-09-14', label: 'Sem 1 Week 6' },
  { date: '2026-09-19', label: 'Recess Week' },
  { date: '2026-09-28', label: 'Sem 1 Week 7' },
  { date: '2026-10-05', label: 'Sem 1 Week 8' },
  { date: '2026-10-12', label: 'Sem 1 Week 9' },
  { date: '2026-10-19', label: 'Sem 1 Week 10' },
  { date: '2026-10-26', label: 'Sem 1 Week 11' },
  { date: '2026-11-02', label: 'Sem 1 Week 12' },
  { date: '2026-11-09', label: 'Sem 1 Week 13' },
  { date: '2026-11-14', label: 'Reading Week' },
  { date: '2026-11-21', label: 'Examination Week' },
  { date: '2026-12-06', label: null },

  { date: '2027-01-11', label: 'Sem 2 Week 1' },
  { date: '2027-01-18', label: 'Sem 2 Week 2' },
  { date: '2027-01-25', label: 'Sem 2 Week 3' },
  { date: '2027-02-01', label: 'Sem 2 Week 4' },
  { date: '2027-02-08', label: 'Sem 2 Week 5' },
  { date: '2027-02-15', label: 'Sem 2 Week 6' },
  { date: '2027-02-20', label: 'Recess Week' },
  { date: '2027-03-01', label: 'Sem 2 Week 7' },
  { date: '2027-03-08', label: 'Sem 2 Week 8' },
  { date: '2027-03-15', label: 'Sem 2 Week 9' },
  { date: '2027-03-22', label: 'Sem 2 Week 10' },
  { date: '2027-03-29', label: 'Sem 2 Week 11' },
  { date: '2027-04-05', label: 'Sem 2 Week 12' },
  { date: '2027-04-12', label: 'Sem 2 Week 13' },
  { date: '2027-04-17', label: 'Reading Week' },
  { date: '2027-04-24', label: 'Examination Week' },
  { date: '2027-05-09', label: null },

  { date: '2027-05-10', label: 'Special Semester' },
  { date: '2027-08-02', label: null },
]

export function getAcademicLabel(date: Date = new Date()): string | null {
  const today = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

  let label: string | null = null
  for (const entry of CALENDAR) {
    if (entry.date <= today) {
      label = entry.label
    } else {
      break
    }
  }
  return label
}

export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-SG', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
}
