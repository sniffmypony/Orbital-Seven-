import { useState } from 'react'
import Button from '@/components/ui/Button'
import FriendAvatar from './FriendAvatar'
import type { FriendRequest } from '@/types'

interface FriendRequestListProps {
  requests: FriendRequest[]
  onRespond: (friendshipId: string, action: 'accept' | 'reject') => Promise<void>
  onBlock: (userId: string) => Promise<void>
}

export default function FriendRequestList({ requests, onRespond, onBlock }: FriendRequestListProps) {
  const [pending, setPending] = useState<string | null>(null)

  if (requests.length === 0) return null

  async function respond(id: string, action: 'accept' | 'reject') {
    setPending(id + action)
    try {
      await onRespond(id, action)
    } finally {
      setPending(null)
    }
  }

  async function block(id: string, userId: string) {
    setPending(id + 'block')
    try {
      await onBlock(userId)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-3">
        Friend requests
        <span className="ml-2 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </h2>

      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.friendshipId} className="flex items-center gap-3 py-2">
            <FriendAvatar user={r.user} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{r.user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{r.user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => respond(r.friendshipId, 'accept')}
                loading={pending === r.friendshipId + 'accept'}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => respond(r.friendshipId, 'reject')}
                loading={pending === r.friendshipId + 'reject'}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => block(r.friendshipId, r.user.id)}
                loading={pending === r.friendshipId + 'block'}
              >
                Block
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
