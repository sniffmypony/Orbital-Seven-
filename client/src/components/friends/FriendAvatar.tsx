import type { FriendUser } from '@/types'

interface FriendAvatarProps {
  user: FriendUser
  size?: number
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function FriendAvatar({ user, size = 40 }: FriendAvatarProps) {
  const dimension = { width: `${size}px`, height: `${size}px` }

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className="rounded-full object-cover shrink-0"
        style={dimension}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0"
      style={{ ...dimension, fontSize: `${size * 0.4}px` }}
    >
      {initials(user.displayName)}
    </div>
  )
}
