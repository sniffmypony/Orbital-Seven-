import { useState } from 'react'
import type { Day, TimetableBlock, BlockVisibility, Friend } from '@/types'
import { useTheme } from '@/lib/theme'
import { validateBlockTimes } from '@/lib/timeUtils'
import Button from '@/components/ui/Button'
import BlockVisibilitySelector from './BlockVisibilitySelector'

const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
]

interface CustomBlockFormProps {
  onSubmit: (block: Omit<TimetableBlock, 'id' | 'userId' | 'createdAt'>) => Promise<void>
  onCancel: () => void
  friends: Friend[]
}

export default function CustomBlockForm({ onSubmit, onCancel, friends }: CustomBlockFormProps) {
  const { nightOwl, setNightOwl } = useTheme()
  const [title,      setTitle]      = useState('')
  const [day,        setDay]        = useState<Day>('Monday')
  const [startTime,  setStartTime]  = useState('08:00')
  const [endTime,    setEndTime]    = useState('09:00')
  const [venue,      setVenue]      = useState('')
  const [note,       setNote]       = useState('')
  const [color,      setColor]      = useState(COLORS[0])
  const [repeat,     setRepeat]     = useState<'weekly' | 'once'>('weekly')
  const [visibility, setVisibility] = useState<BlockVisibility>('friends')
  const [visibleTo,  setVisibleTo]  = useState<string[]>([])
  const [profileVisible, setProfileVisible] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')
  const [nightPrompt, setNightPrompt] = useState(false)

  const toNusTime = (t: string) => t.replace(':', '')

  async function persist() {
    setSaving(true)
    setErr('')
    setNightPrompt(false)
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
        note:   note.trim() || null,
        source: 'custom',
        color,
        visibility,
        visibleTo,
        profileVisible,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save.')
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNightPrompt(false)
    if (!title.trim()) { setErr('Title is required.'); return }

    const s = toNusTime(startTime)
    const en = toNusTime(endTime)
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

      <label className={`flex items-center gap-2 text-sm cursor-pointer ${visibility === 'private' ? 'text-gray-400' : 'text-gray-700'}`}>
        <input
          type="checkbox"
          checked={profileVisible && visibility !== 'private'}
          disabled={visibility === 'private'}
          onChange={(e) => setProfileVisible(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        Show on my profile (group members who are not friends can see this)
      </label>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {nightPrompt && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 space-y-2">
          <p className="text-sm text-violet-900">
            🦉 This block runs past 10:00 PM. The Night Owl calendar (8:00 AM – 2:00 AM) is needed
            for late-night blocks. Enable it and add this block?
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" loading={saving} onClick={enableNightOwlAndSave}>
              Enable Night Owl &amp; add
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setNightPrompt(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} className="flex-1">Add block</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
