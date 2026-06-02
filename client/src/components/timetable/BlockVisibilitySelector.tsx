import { useState } from 'react'
import type { BlockVisibility, Friend } from '@/types'

interface BlockVisibilitySelectorProps {
  visibility: BlockVisibility
  visibleTo: string[]
  friends: Friend[]
  onChange: (visibility: BlockVisibility, visibleTo: string[]) => void
}

const OPTIONS: Array<{ value: BlockVisibility; label: string }> = [
  { value: 'friends', label: 'All my friends' },
  { value: 'only',    label: 'Only specific friends' },
  { value: 'except',  label: 'All friends except' },
  { value: 'private', label: 'Only me (private)' },
]

export default function BlockVisibilitySelector({
  visibility,
  visibleTo,
  friends,
  onChange,
}: BlockVisibilitySelectorProps) {
  const [query, setQuery] = useState('')

  const needsPicker = visibility === 'only' || visibility === 'except'

  const selected = new Set(visibleTo)

  const filtered = friends.filter((f) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      f.user.displayName.toLowerCase().includes(q) ||
      f.user.email.toLowerCase().includes(q)
    )
  })

  function toggle(userId: string) {
    const next = new Set(selected)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    onChange(visibility, Array.from(next))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Who can see this?</label>
      <select
        value={visibility}
        onChange={(e) => onChange(e.target.value as BlockVisibility, visibleTo)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {needsPicker && (
        <div className="mt-3 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">
            {visibility === 'only'
              ? 'Pick the friends who are allowed to see this block.'
              : 'Pick the friends who should not see this block.'}
          </p>

          {friends.length === 0 ? (
            <p className="text-xs text-gray-400">You have no friends to choose from yet.</p>
          ) : (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filtered.map((f) => (
                  <label
                    key={f.user.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(f.user.id)}
                      onChange={() => toggle(f.user.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 truncate">{f.user.displayName}</span>
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 px-2 py-1">No friends match your search.</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{selected.size} selected</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
