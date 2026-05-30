import { useState } from 'react'
import type { Day, TimetableBlock } from '@/types'
import Button from '@/components/ui/Button'

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface EditBlockFormProps {
  block:    TimetableBlock
  onSave:   (updates: {
    day:       Day
    startTime: string
    endTime:   string
    venue:     string | null
    color:     string
  }) => Promise<void>
  onCancel: () => void
}

export default function EditBlockForm({ block, onSave, onCancel }: EditBlockFormProps) {

  const toInput = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`
  const toStore = (t: string) => t.replace(':', '')

  const [day,       setDay]       = useState<Day>(block.day)
  const [startTime, setStartTime] = useState(toInput(block.startTime))
  const [endTime,   setEndTime]   = useState(toInput(block.endTime))
  const [venue,     setVenue]     = useState(block.venue ?? '')
  const [color,     setColor]     = useState(block.color)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (toStore(startTime) >= toStore(endTime)) {
      setErr('End time must be after start time.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      await onSave({
        day,
        startTime: toStore(startTime),
        endTime:   toStore(endTime),
        venue:     venue.trim() || null,
        color,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div
        className="px-3 py-2 rounded-lg text-sm font-semibold text-white truncate"
        style={{ backgroundColor: color }}
      >
        {block.title}
      </div>

      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value as Day)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Venue (optional)</label>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. LT27"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#1f2937' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} className="flex-1">Save changes</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
