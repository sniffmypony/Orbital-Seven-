import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import Button from '@/components/ui/Button'

interface CreateGroupModalProps {
  onCreate: (name: string, avatarUrl: string, memberIds: string[]) => Promise<{ id: string }>
  onDone: (groupId: string) => void
  onCancel: () => void
}

export default function CreateGroupModal({ onCreate, onDone, onCancel }: CreateGroupModalProps) {
  const { friends } = useFriends()
  const [name,      setName]      = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selected,  setSelected]  = useState<string[]>([])
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function submit() {
    if (!name.trim()) { setErr('Please give the group a name.'); return }
    setSaving(true)
    setErr('')
    try {
      const group = await onCreate(name.trim(), avatarUrl.trim(), selected)
      onDone(group.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create group.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CS2103 Project Team"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group picture URL (optional)</label>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Add friends</label>
        {friends.length === 0 ? (
          <p className="text-xs text-gray-400">You have no friends to add yet. You can create the group and add people later.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
            {friends.map((f) => (
              <label key={f.user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(f.user.id)}
                  onChange={() => toggle(f.user.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{f.user.displayName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2 pt-1">
        <Button onClick={submit} loading={saving} className="flex-1">Create group</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
