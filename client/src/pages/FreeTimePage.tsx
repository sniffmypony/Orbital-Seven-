import { useEffect, useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { useFreeTime } from '@/hooks/useFreeTime'
import FreeTimeGrid from '@/components/freetime/FreeTimeGrid'
import FriendAvatar from '@/components/friends/FriendAvatar'

export default function FreeTimePage() {
  const { friends, loading: friendsLoading } = useFriends()
  const { data, loading, error, fetchFreeTime } = useFreeTime()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    fetchFreeTime(selected)
  }, [selected, fetchFreeTime])

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Free Time</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pick friends to see when you are all free. Times everyone shares as busy are removed; only blocks
          visible to you are counted.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Compare with</h2>
        {friendsLoading ? (
          <p className="text-sm text-gray-400">Loading friends…</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400">
            You have no friends yet. Your own free time is shown below; add friends to compare.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => {
              const on = selected.includes(f.user.id)
              return (
                <button
                  key={f.user.id}
                  onClick={() => toggle(f.user.id)}
                  className={[
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    on
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {f.user.displayName}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">Showing common free time for:</span>
          {data.participants.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5">
              <FriendAvatar user={{ id: p.id, displayName: p.displayName, email: '', avatarUrl: p.avatarUrl }} size={24} />
              <span className="text-sm text-gray-700">{p.isSelf ? 'You' : p.displayName}</span>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <FreeTimeGrid days={data.days} />
      ) : null}
    </div>
  )
}
