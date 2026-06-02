import { useState } from 'react'
import Button from '@/components/ui/Button'
import FriendAvatar from './FriendAvatar'
import type { BlockedUser } from '@/types'

interface BlockedListProps {
  blocked: BlockedUser[]
  onUnblock: (userId: string) => Promise<void>
}

export default function BlockedList({ blocked, onUnblock }: BlockedListProps) {
  const [pending, setPending] = useState<string | null>(null)

  if (blocked.length === 0) return null

  async function unblock(userId: string) {
    setPending(userId)
    try {
      await onUnblock(userId)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">
        Blocked
        <span className="ml-2 text-xs font-medium text-gray-500">{blocked.length}</span>
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Blocked people cannot see your requests or be seen here by you. They are not told they are blocked.
      </p>

      <ul className="space-y-2">
        {blocked.map((b) => (
          <li key={b.blockId} className="flex items-center gap-3 py-2">
            <FriendAvatar user={b.user} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{b.user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{b.user.email}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => unblock(b.user.id)}
              loading={pending === b.user.id}
            >
              Unblock
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
