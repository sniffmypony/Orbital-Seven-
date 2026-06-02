import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import { useFriends } from '@/hooks/useFriends'
import Button from '@/components/ui/Button'
import FriendAvatar from '@/components/friends/FriendAvatar'
import FriendSearch from '@/components/friends/FriendSearch'
import FriendList from '@/components/friends/FriendList'
import BlockedList from '@/components/friends/BlockedList'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const { getToken } = useAuth()
  const { friends, blocked, removeFriend, unblockUser, refetch } = useFriends()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [displayName,    setDisplayName]    = useState('')
  const [major,          setMajor]          = useState('')
  const [bio,            setBio]            = useState('')
  const [defaultVis,     setDefaultVis]     = useState<'private' | 'friends'>('friends')
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const token = await getToken()
        const data = await api.get<Profile>('/api/profile', token ?? undefined)
        if (!active) return
        setProfile(data)
        setDisplayName(data.displayName ?? '')
        setMajor(data.major ?? '')
        setBio(data.bio ?? '')
        setDefaultVis(data.defaultBlockVisibility)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load profile.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [getToken])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const token = await getToken()
      const updated = await api.patch<Profile>(
        '/api/profile',
        { displayName, major, bio, defaultBlockVisibility: defaultVis },
        token ?? undefined
      )
      setProfile(updated)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your public details, defaults, friends and blocked users.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-4">
          {profile && (
            <FriendAvatar
              user={{ id: profile.id, displayName, email: profile.email, avatarUrl: profile.avatarUrl }}
              size={56}
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{displayName || 'Your name'}</p>
            <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="The name other students see"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
          <input
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short biography about yourself."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default visibility for new blocks</label>
          <select
            value={defaultVis}
            onChange={(e) => setDefaultVis(e.target.value as 'private' | 'friends')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="friends">All my friends</option>
            <option value="private">Only me (private)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            New imported and custom blocks will use this visibility unless you change it per block.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>Save profile</Button>
          {saved && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </form>

      <FriendSearch onChanged={refetch} />
      <FriendList friends={friends} onRemove={removeFriend} />
      <BlockedList blocked={blocked} onUnblock={unblockUser} />
    </div>
  )
}
