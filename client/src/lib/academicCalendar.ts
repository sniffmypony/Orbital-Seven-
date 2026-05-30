// NUS Academic Calendar — AY2025/2026 and AY2026/2027
// Source: official calendars published 05/08/2025
//
// Each entry marks the START of a period (inclusive).
// A period extends until the next entry's date (exclusive).
// label: null  → vacation / orientation week — no label shown in the UI
//
// Label options (per spec):
//   "Sem 1 Week N" | "Sem 2 Week N"
//   "Recess Week"
//   "Reading Week"
//   "Examination Week"
//   "Special Semester"

interface CalendarEntry {
  date:  string        // YYYY-MM-DD — first day of the period
  label: string | null
}

const CALENDAR: CalendarEntry[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // AY 2025/2026 — SEMESTER 1
  // ─────────────────────────────────────────────────────────────────────────────
  { date: '2025-08-04', label: null },              // Orientation  Mon 4 Aug – Sat 9 Aug
  { date: '2025-08-11', label: 'Sem 1 Week 1' },   // Mon 11 Aug – Fri 15 Aug
  { date: '2025-08-18', label: 'Sem 1 Week 2' },   // Mon 18 Aug – Fri 22 Aug
  { date: '2025-08-25', label: 'Sem 1 Week 3' },   // Mon 25 Aug – Fri 29 Aug
  { date: '2025-09-01', label: 'Sem 1 Week 4' },   // Mon  1 Sep – Fri  5 Sep
  { date: '2025-09-08', label: 'Sem 1 Week 5' },   // Mon  8 Sep – Fri 12 Sep
  { date: '2025-09-15', label: 'Sem 1 Week 6' },   // Mon 15 Sep – Fri 19 Sep
  { date: '2025-09-20', label: 'Recess Week' },    // Sat 20 Sep – Sun 28 Sep
  { date: '2025-09-29', label: 'Sem 1 Week 7' },   // Mon 29 Sep – Sat  4 Oct
  { date: '2025-10-06', label: 'Sem 1 Week 8' },   // Mon  6 Oct – Fri 10 Oct
  { date: '2025-10-13', label: 'Sem 1 Week 9' },   // Mon 13 Oct – Fri 17 Oct
  { date: '2025-10-20', label: 'Sem 1 Week 10' },  // Mon 20 Oct – Fri 24 Oct
  { date: '2025-10-27', label: 'Sem 1 Week 11' },  // Mon 27 Oct – Fri 31 Oct
  { date: '2025-11-03', label: 'Sem 1 Week 12' },  // Mon  3 Nov – Fri  7 Nov
  { date: '2025-11-10', label: 'Sem 1 Week 13' },  // Mon 10 Nov – Fri 14 Nov
  { date: '2025-11-15', label: 'Reading Week' },   // Sat 15 Nov – Fri 21 Nov
  { date: '2025-11-22', label: 'Examination Week' }, // Sat 22 Nov – Sat  6 Dec
  { date: '2025-12-07', label: null },              // Vacation  Sun  7 Dec – Sun 11 Jan

  // ─────────────────────────────────────────────────────────────────────────────
  // AY 2025/2026 — SEMESTER 2
  // ─────────────────────────────────────────────────────────────────────────────
  { date: '2026-01-12', label: 'Sem 2 Week 1' },   // Mon 12 Jan – Fri 16 Jan
  { date: '2026-01-19', label: 'Sem 2 Week 2' },   // Mon 19 Jan – Fri 23 Jan
  { date: '2026-01-26', label: 'Sem 2 Week 3' },   // Mon 26 Jan – Fri 30 Jan
  { date: '2026-02-02', label: 'Sem 2 Week 4' },   // Mon  2 Feb – Fri  6 Feb
  { date: '2026-02-09', label: 'Sem 2 Week 5' },   // Mon  9 Feb – Fri 13 Feb
  { date: '2026-02-16', label: 'Sem 2 Week 6' },   // Mon 16 Feb – Fri 20 Feb
  { date: '2026-02-21', label: 'Recess Week' },    // Sat 21 Feb – Sun  1 Mar
  { date: '2026-03-02', label: 'Sem 2 Week 7' },   // Mon  2 Mar – Sat  7 Mar
  { date: '2026-03-09', label: 'Sem 2 Week 8' },   // Mon  9 Mar – Fri 13 Mar
  { date: '2026-03-16', label: 'Sem 2 Week 9' },   // Mon 16 Mar – Fri 20 Mar
  { date: '2026-03-23', label: 'Sem 2 Week 10' },  // Mon 23 Mar – Fri 27 Mar
  { date: '2026-03-30', label: 'Sem 2 Week 11' },  // Mon 30 Mar – Fri  3 Apr
  { date: '2026-04-06', label: 'Sem 2 Week 12' },  // Mon  6 Apr – Fri 10 Apr
  { date: '2026-04-13', label: 'Sem 2 Week 13' },  // Mon 13 Apr – Fri 17 Apr
  { date: '2026-04-18', label: 'Reading Week' },   // Sat 18 Apr – Fri 24 Apr
  { date: '2026-04-25', label: 'Examination Week' }, // Sat 25 Apr – Sat  9 May
  { date: '2026-05-10', label: null },              // Sun 10 May (gap day)
  // Special Term Pt 1: Mon 11 May – Sat 20 Jun  |  Pt 2: Mon 22 Jun – Sat 1 Aug
  { date: '2026-05-11', label: 'Special Semester' },
  { date: '2026-08-02', label: null },              // Vacation before AY2026/27

  // ─────────────────────────────────────────────────────────────────────────────
  // AY 2026/2027 — SEMESTER 1
  // ─────────────────────────────────────────────────────────────────────────────
  { date: '2026-08-03', label: null },              // Orientation  Mon 3 Aug – Sat 8 Aug
  { date: '2026-08-10', label: 'Sem 1 Week 1' },   // Mon 10 Aug – Fri 14 Aug
  { date: '2026-08-17', label: 'Sem 1 Week 2' },   // Mon 17 Aug – Fri 21 Aug
  { date: '2026-08-24', label: 'Sem 1 Week 3' },   // Mon 24 Aug – Fri 28 Aug
  { date: '2026-08-31', label: 'Sem 1 Week 4' },   // Mon 31 Aug – Fri  4 Sep
  { date: '2026-09-07', label: 'Sem 1 Week 5' },   // Mon  7 Sep – Fri 11 Sep
  { date: '2026-09-14', label: 'Sem 1 Week 6' },   // Mon 14 Sep – Fri 18 Sep
  { date: '2026-09-19', label: 'Recess Week' },    // Sat 19 Sep – Sun 27 Sep
  { date: '2026-09-28', label: 'Sem 1 Week 7' },   // Mon 28 Sep – Sat  3 Oct
  { date: '2026-10-05', label: 'Sem 1 Week 8' },   // Mon  5 Oct – Fri  9 Oct
  { date: '2026-10-12', label: 'Sem 1 Week 9' },   // Mon 12 Oct – Fri 16 Oct
  { date: '2026-10-19', label: 'Sem 1 Week 10' },  // Mon 19 Oct – Fri 23 Oct
  { date: '2026-10-26', label: 'Sem 1 Week 11' },  // Mon 26 Oct – Fri 30 Oct
  { date: '2026-11-02', label: 'Sem 1 Week 12' },  // Mon  2 Nov – Fri  6 Nov
  { date: '2026-11-09', label: 'Sem 1 Week 13' },  // Mon  9 Nov – Fri 13 Nov
  { date: '2026-11-14', label: 'Reading Week' },   // Sat 14 Nov – Fri 20 Nov
  { date: '2026-11-21', label: 'Examination Week' }, // Sat 21 Nov – Sat  5 Dec
  { date: '2026-12-06', label: null },              // Vacation  Sun 6 Dec – Sun 10 Jan

  // ─────────────────────────────────────────────────────────────────────────────
  // AY 2026/2027 — SEMESTER 2
  // ─────────────────────────────────────────────────────────────────────────────
  { date: '2027-01-11', label: 'Sem 2 Week 1' },   // Mon 11 Jan – Fri 15 Jan
  { date: '2027-01-18', label: 'Sem 2 Week 2' },   // Mon 18 Jan – Fri 22 Jan
  { date: '2027-01-25', label: 'Sem 2 Week 3' },   // Mon 25 Jan – Fri 29 Jan
  { date: '2027-02-01', label: 'Sem 2 Week 4' },   // Mon  1 Feb – Fri  5 Feb
  { date: '2027-02-08', label: 'Sem 2 Week 5' },   // Mon  8 Feb – Fri 12 Feb
  { date: '2027-02-15', label: 'Sem 2 Week 6' },   // Mon 15 Feb – Fri 19 Feb
  { date: '2027-02-20', label: 'Recess Week' },    // Sat 20 Feb – Sun 28 Feb
  { date: '2027-03-01', label: 'Sem 2 Week 7' },   // Mon  1 Mar – Sat  6 Mar
  { date: '2027-03-08', label: 'Sem 2 Week 8' },   // Mon  8 Mar – Fri 12 Mar
  { date: '2027-03-15', label: 'Sem 2 Week 9' },   // Mon 15 Mar – Fri 19 Mar
  { date: '2027-03-22', label: 'Sem 2 Week 10' },  // Mon 22 Mar – Fri 26 Mar
  { date: '2027-03-29', label: 'Sem 2 Week 11' },  // Mon 29 Mar – Fri  2 Apr
  { date: '2027-04-05', label: 'Sem 2 Week 12' },  // Mon  5 Apr – Fri  9 Apr
  { date: '2027-04-12', label: 'Sem 2 Week 13' },  // Mon 12 Apr – Fri 16 Apr
  { date: '2027-04-17', label: 'Reading Week' },   // Sat 17 Apr – Fri 23 Apr
  { date: '2027-04-24', label: 'Examination Week' }, // Sat 24 Apr – Sat  8 May
  { date: '2027-05-09', label: null },              // Gap day (Sun)
  // Special Term Pt 1: Mon 10 May – Sat 19 Jun  |  Pt 2: Mon 21 Jun – Sat 31 Jul
  { date: '2027-05-10', label: 'Special Semester' },
  { date: '2027-08-02', label: null },              // Vacation before AY2027/28
]

/**
 * Returns the NUS academic period label for the given date.
 * Returns null during vacations and orientation week (nothing to display).
 *
 * Examples: "Sem 1 Week 3" | "Recess Week" | "Reading Week" |
 *           "Examination Week" | "Special Semester"
 */
export function getAcademicLabel(date: Date = new Date()): string | null {
  const today = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

  // Walk the sorted array; the last entry whose date ≤ today wins.
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

/**
 * Formats a Date as "Wednesday, 28 May 2026" (Singapore locale).
 */
export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-SG', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
}
