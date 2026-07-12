import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import FriendAvatar from '@/components/friends/FriendAvatar'
import type { MemberTimetable } from '@/types'

export default function GroupMemberTimetablePage() {
  const { groupId, memberId } = useParams()
  const { getToken } = useAuth()
  const { nightOwl } = useTheme()
  const [data,    setData]    = useState<MemberTimetable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const token = await getToken()
        const res = await api.get<MemberTimetable>(
          `/api/groups/${groupId}/members/${memberId}/timetable`,
          token ?? undefined
        )
        if (active) setData(res)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load timetable.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [groupId, memberId, getToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to={`/groups/${groupId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          ← Back to chat
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error || 'Member not found.'}
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
        <FriendAvatar
          user={{ id: data.user.id, displayName: data.user.displayName, email: '', avatarUrl: data.user.avatarUrl }}
          size={48}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.user.displayName}</h1>
          <p className="text-sm text-gray-500">
            {data.isSelf ? 'This is you' : data.isFriend ? 'Friend' : 'Group member'}
          </p>
        </div>
      </div>

      {!data.isSelf && !data.isFriend && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          You are not friends with {data.user.displayName}, so only the blocks they show on their profile are visible.
        </div>
      )}

      {data.blocks.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">
            {data.user.displayName} has no visible timetable blocks.
          </p>
        </div>
      ) : (
        <TimetableGrid blocks={data.blocks} readOnly nightOwl={nightOwl} />
      )}
    </div>
  )
}
