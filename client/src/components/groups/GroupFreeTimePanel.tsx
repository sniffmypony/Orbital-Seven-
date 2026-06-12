import { useEffect, useState } from 'react'
import { formatTimeDisplay } from '@/lib/timeUtils'
import type { GroupAvailability, GroupAvailabilitySlot } from '@/types'

interface GroupFreeTimePanelProps {
  fetchFreeTime: () => Promise<GroupAvailability>
}

function SlotRow({ slot }: { slot: GroupAvailabilitySlot }) {
  const everyone = slot.busyNames.length === 0
  return (
    <div
      className={[
        'flex items-center justify-between gap-2 px-3 py-2 rounded-lg border',
        everyone ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
      ].join(' ')}
      title={slot.busyNames.length ? `Not free: ${slot.busyNames.join(', ')}` : 'Everyone is free'}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">
          {slot.day} · {formatTimeDisplay(slot.start)}–{formatTimeDisplay(slot.end)}
        </p>
        {slot.busyNames.length > 0 && (
          <p className="text-xs text-gray-500">Busy: {slot.busyNames.join(', ')}</p>
        )}
      </div>
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${everyone ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
        {slot.freeCount}/{slot.totalCount} free
      </span>
    </div>
  )
}

export default function GroupFreeTimePanel({ fetchFreeTime }: GroupFreeTimePanelProps) {
  const [data,    setData]    = useState<GroupAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    let active = true
    fetchFreeTime()
      .then((d) => { if (active) setData(d) })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Could not load free time.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fetchFreeTime])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        Based on {data.totalCount} member{data.totalCount === 1 ? '' : 's'}. Only blocks shared with you are counted,
        so members whose timetable you cannot see are treated as free.
      </p>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Everyone is free</h3>
        {data.everyoneFree.length === 0 ? (
          <p className="text-sm text-gray-400">No slot this week where every member is free — see the best options below.</p>
        ) : (
          <div className="space-y-1.5">
            {data.everyoneFree.map((s, i) => <SlotRow key={i} slot={s} />)}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Best times (most people available)</h3>
        {data.bestSlots.length === 0 ? (
          <p className="text-sm text-gray-400">No availability found.</p>
        ) : (
          <div className="space-y-1.5">
            {data.bestSlots.map((s, i) => <SlotRow key={i} slot={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
