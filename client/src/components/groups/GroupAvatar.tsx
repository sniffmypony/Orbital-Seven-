interface GroupAvatarProps {
  name: string
  avatarUrl: string | null
  size?: number
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '#'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function GroupAvatar({ name, avatarUrl, size = 44 }: GroupAvatarProps) {
  const dim = { width: `${size}px`, height: `${size}px` }
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="rounded-2xl object-cover shrink-0" style={dim} />
  }
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-primary-400 to-violet-500 text-white flex items-center justify-center font-bold shrink-0"
      style={{ ...dim, fontSize: `${size * 0.36}px` }}
    >
      {initials(name)}
    </div>
  )
}
