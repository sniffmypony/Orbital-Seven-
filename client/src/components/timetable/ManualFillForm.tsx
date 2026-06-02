import { useState } from 'react'
import type { Day, FailedImport } from '@/types'
import type { NewBlock } from '@/hooks/useTimetable'
import { validateBlockTimes } from '@/lib/timeUtils'
import Button from '@/components/ui/Button'

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface ManualFillFormProps {
  failed: FailedImport[]
  onSubmit: (blocks: NewBlock[]) => Promise<void>
  onCancel: () => void
}

interface RowState {
  include: boolean
  day: Day
  start: string
  end: string
  venue: string
}

export default function ManualFillForm({ failed, onSubmit, onCancel }: ManualFillFormProps) {
  const [rows, setRows] = useState<RowState[]>(
    failed.map(() => ({ include: true, day: 'Monday', start: '08:00', end: '09:00', venue: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function update(i: number, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const toStore = (t: string) => t.replace(':', '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const blocks: NewBlock[] = []
    for (let i = 0; i < failed.length; i++) {
      const row = rows[i]
      if (!row.include) continue
      const timeError = validateBlockTimes(toStore(row.start), toStore(row.end), false)
      if (timeError) {
        setErr(`${failed[i].moduleCode} ${failed[i].lessonLabel}: ${timeError}`)
        return
      }
      const f = failed[i]
      blocks.push({
        moduleCode: f.moduleCode,
        lessonType: f.lessonLabel,
        classNo: f.classNo,
        title: `${f.moduleCode} ${f.lessonLabel}`,
        day: row.day,
        startTime: toStore(row.start),
        endTime: toStore(row.end),
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        venue: row.venue.trim() || null,
        note: null,
        source: 'nusmods',
        color: f.color,
      })
    }

    if (blocks.length === 0) {
      setErr('Tick at least one slot to add, or cancel.')
      return
    }

    setSaving(true)
    setErr('')
    try {
      await onSubmit(blocks)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add blocks.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        We couldn&apos;t pull the timing and venue for these classes from NUSMods
        (they don&apos;t exist for the imported academic year). Fill in the details yourself,
        or untick any you don&apos;t want.
      </p>

      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {failed.map((f, i) => (
          <div
            key={`${f.moduleCode}-${f.lessonType}-${f.classNo}-${i}`}
            className="border border-gray-200 rounded-lg p-3"
            style={{ borderLeft: `4px solid ${f.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-medium text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={rows[i].include}
                  onChange={(e) => update(i, { include: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {f.moduleCode} {f.lessonLabel}
                <span className="text-xs font-normal text-gray-400">class {f.classNo}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Day</label>
                <select
                  value={rows[i].day}
                  onChange={(e) => update(i, { day: e.target.value as Day })}
                  disabled={!rows[i].include}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Venue</label>
                <input
                  value={rows[i].venue}
                  onChange={(e) => update(i, { venue: e.target.value })}
                  disabled={!rows[i].include}
                  placeholder="e.g. LT27"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input
                  type="time"
                  value={rows[i].start}
                  onChange={(e) => update(i, { start: e.target.value })}
                  disabled={!rows[i].include}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input
                  type="time"
                  value={rows[i].end}
                  onChange={(e) => update(i, { end: e.target.value })}
                  disabled={!rows[i].include}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} className="flex-1">Add these blocks</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Skip</Button>
      </div>
    </form>
  )
}
