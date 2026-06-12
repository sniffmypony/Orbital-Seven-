import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroups } from '@/hooks/useGroups'
import GroupAvatar from '@/components/groups/GroupAvatar'
import CreateGroupModal from '@/components/groups/CreateGroupModal'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

function preview(kind: string, text: string | null) {
  if (kind === 'poll') return '📊 Poll'
  if (kind === 'event') return '📅 Event'
  if (kind === 'image') return '🖼️ Photo'
  if (kind === 'video') return '🎬 Video'
  return text ?? ''
}

export default function GroupsPage() {
  const { groups, loading, error, createGroup } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chat, find free time, run polls and plan events together.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ New group</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 flex items-center justify-center h-48">
          <p className="text-gray-400 text-sm">No groups yet. Create one to start chatting.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
            >
              <GroupAvatar name={g.name} avatarUrl={g.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{g.name}</p>
                  {g.muted && <span className="text-xs text-gray-400">🔕</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {g.lastMessage ? preview(g.lastMessage.kind, g.lastMessage.text) : `${g.memberCount} members`}
                </p>
              </div>
              {g.unread > 0 && (
                <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
                  {g.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New group">
        <CreateGroupModal
          onCreate={createGroup}
          onDone={(id) => { setShowCreate(false); navigate(`/groups/${id}`) }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  )
}
