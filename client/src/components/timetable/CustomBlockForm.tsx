import { useState } from 'react'
import type { Day, TimetableBlock } from '@/types'
import Button from '@/components/ui/Button'

const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
]

interface CustomBlockFormProps {
  onSubmit: (block: Omit<TimetableBlock, 'id' | 'userId' | 'createdAt'>) => Promise<void>
  onCancel: () => void
}

export default function CustomBlockForm({ onSubmit, onCancel }: CustomBlockFormProps) {
  const [title,     setTitle]     = useState('')
  const [day,       setDay]       = useState<Day>('Monday')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime,   setEndTime]   = useState('09:00')
  const [venue,     setVenue]     = useState('')
  const [color,     setColor]     = useState(COLORS[0])
  const [repeat,    setRepeat]    = useState<'weekly' | 'once'>('weekly')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  const toNusTime = (t: string) => t.replace(':', '')   // "08:00" → "0800"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setErr('Title is required.'); return }
    if (toNusTime(startTime) >= toNusTime(endTime)) { setErr('End time must be after start time.'); return }

    setSaving(true)
    setErr('')
    try {
      await onSubmit({
        moduleCode: null,
        lessonType: null,
        classNo:    null,
        title:      title.trim(),
        day,
        startTime:  toNusTime(startTime),
        endTime:    toNusTime(endTime),
        weeks:      repeat === 'weekly'
          ? [1,2,3,4,5,6,7,8,9,10,11,12,13]
          : [1],
        venue:  venue.trim() || null,
        source: 'custom',
        color,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Family Dinner"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as 'weekly' | 'once')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="weekly">Every week</option>
            <option value="once">One-off</option>
          </select>
        </div>
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
          placeholder="e.g. Home"
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
        <Button type="submit" loading={saving} className="flex-1">Add block</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
