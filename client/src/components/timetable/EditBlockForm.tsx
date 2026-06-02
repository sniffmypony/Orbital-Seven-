import { useState } from 'react'
import type { Day, TimetableBlock, BlockVisibility, Friend } from '@/types'
import { useTheme } from '@/lib/theme'
import { validateBlockTimes } from '@/lib/timeUtils'
import Button from '@/components/ui/Button'
import BlockVisibilitySelector from './BlockVisibilitySelector'

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface EditBlockFormProps {
  block:    TimetableBlock
  onSave:   (updates: {
    day:        Day
    startTime:  string
    endTime:    string
    venue:      string | null
    note:       string | null
    color:      string
    visibility: BlockVisibility
    visibleTo:  string[]
  }) => Promise<void>
  onCancel: () => void
  friends:  Friend[]
}

export default function EditBlockForm({ block, onSave, onCancel, friends }: EditBlockFormProps) {
  const { nightOwl, setNightOwl } = useTheme()

  const toInput = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`
  const toStore = (t: string) => t.replace(':', '')

  const [day,        setDay]        = useState<Day>(block.day)
  const [startTime,  setStartTime]  = useState(toInput(block.startTime))
  const [endTime,    setEndTime]    = useState(toInput(block.endTime))
  const [venue,      setVenue]      = useState(block.venue ?? '')
  const [note,       setNote]       = useState(block.note ?? '')
  const [color,      setColor]      = useState(block.color)
  const [visibility, setVisibility] = useState<BlockVisibility>(block.visibility)
  const [visibleTo,  setVisibleTo]  = useState<string[]>(block.visibleTo ?? [])
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')
  const [nightPrompt, setNightPrompt] = useState(false)

  async function persist() {
    setSaving(true)
    setErr('')
    setNightPrompt(false)
    try {
      await onSave({
        day,
        startTime: toStore(startTime),
        endTime:   toStore(endTime),
        venue:     venue.trim() || null,
        note:      note.trim() || null,
        color,
        visibility,
        visibleTo,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save.')
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNightPrompt(false)

    const s = toStore(startTime)
    const en = toStore(endTime)
    const error = validateBlockTimes(s, en, nightOwl)
    if (error) {
      if (!nightOwl && validateBlockTimes(s, en, true) === null) {
        setErr('')
        setNightPrompt(true)
        return
      }
      setErr(error)
      return
    }

    await persist()
  }

  async function enableNightOwlAndSave() {
    setNightOwl(true)
    await persist()
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Quiz this week, 19 Jan"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      <BlockVisibilitySelector
        visibility={visibility}
        visibleTo={visibleTo}
        friends={friends}
        onChange={(v, list) => { setVisibility(v); setVisibleTo(list) }}
      />

      {err && <p className="text-sm text-red-600">{err}</p>}

      {nightPrompt && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 space-y-2">
          <p className="text-sm text-violet-900">
            🦉 This block runs past 10:00 PM. The Night Owl calendar (8:00 AM – 2:00 AM) is needed
            for late-night blocks. Enable it and save?
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" loading={saving} onClick={enableNightOwlAndSave}>
              Enable Night Owl &amp; save
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setNightPrompt(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} className="flex-1">Save changes</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
