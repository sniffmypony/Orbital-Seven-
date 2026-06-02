import { Link } from 'react-router-dom'
import FriendAvatar from './FriendAvatar'
import type { Friend } from '@/types'

interface FriendListProps {
  friends: Friend[]
  onRemove: (friendshipId: string) => void
}

export default function FriendList({ friends, onRemove }: FriendListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-3">
        My friends
        <span className="ml-2 text-xs font-medium text-gray-500">{friends.length}</span>
      </h2>

      {friends.length === 0 ? (
        <p className="text-sm text-gray-400">
          You have no friends yet. Search for people above to send a request.
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <li key={f.friendshipId} className="flex items-center gap-3 py-2">
              <FriendAvatar user={f.user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{f.user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{f.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/friends/${f.user.id}/timetable`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View timetable
                </Link>
                <button
                  onClick={() => onRemove(f.friendshipId)}
                  className="text-sm text-gray-400 hover:text-red-500"
                  title="Remove friend"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
