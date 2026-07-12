import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import GroupAvatar from '@/components/groups/GroupAvatar'
import OverlapGrid from '@/components/groups/OverlapGrid'
import FriendAvatar from '@/components/friends/FriendAvatar'
import type { GroupDetail, GroupOverlap } from '@/types'

export default function GroupOverviewPage() {
  const { groupId } = useParams()
  const { getToken } = useAuth()
  const [detail,   setDetail]   = useState<GroupDetail | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [ready,    setReady]    = useState(false)
  const [overlap,  setOverlap]  = useState<GroupOverlap | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const token = await getToken()
        const d = await api.get<GroupDetail>(`/api/groups/${groupId}`, token ?? undefined)
        if (!active) return
        setDetail(d)
        setSelected(d.members.map((m) => m.user.id))
        setReady(true)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load group.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [groupId, getToken])

  useEffect(() => {
    if (!ready) return
    if (selected.length === 0) {
      setOverlap(null)
      return
    }
    let active = true
    ;(async () => {
      try {
        const token = await getToken()
        const o = await api.get<GroupOverlap>(
          `/api/groups/${groupId}/overlap?memberIds=${selected.join(',')}`,
          token ?? undefined
        )
        if (active) setOverlap(o)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not compute the overview.')
      }
    })()
    return () => { active = false }
  }, [ready, selected, groupId, getToken])

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link to={`/groups/${groupId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          ← Back to chat
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error || 'Group not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to={`/groups/${groupId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
        ← Back to chat
      </Link>

      <div className="flex items-center gap-3">
        <GroupAvatar name={detail.group.name} avatarUrl={detail.group.avatarUrl} size={44} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{detail.group.name}</h1>
          <p className="text-sm text-gray-500">Timetable overview — overlap any members&apos; timetables</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-300 border border-emerald-500" /> everyone selected is free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-300 border border-rose-500" /> someone is busy (hover for who)
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <aside className="md:w-60 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Overlap timetables of</h2>
          <div className="space-y-1">
            {detail.members.map((m) => (
              <label
                key={m.user.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m.user.id)}
                  onChange={() => toggle(m.user.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <FriendAvatar
                  user={{ id: m.user.id, displayName: m.user.displayName, email: '', avatarUrl: m.user.avatarUrl }}
                  size={24}
                />
                <span className="text-sm text-gray-700 truncate">
                  {m.user.displayName}{m.isSelf ? ' (you)' : ''}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Only blocks each member shares with you are counted; hidden blocks are treated as free.
          </p>
        </aside>

        <div className="flex-1 min-w-0">
          {selected.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm">Select at least one member to see the overlap.</p>
            </div>
          ) : overlap ? (
            <OverlapGrid days={overlap.days} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
