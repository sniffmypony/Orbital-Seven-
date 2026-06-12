import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGroupChat } from '@/hooks/useGroupChat'
import { useFriends } from '@/hooks/useFriends'
import GroupAvatar from '@/components/groups/GroupAvatar'
import MessageItem from '@/components/groups/MessageItem'
import GroupFreeTimePanel from '@/components/groups/GroupFreeTimePanel'
import FriendAvatar from '@/components/friends/FriendAvatar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function GroupChatPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const id = groupId ?? ''
  const chat = useGroupChat(id)
  const { friends } = useFriends()

  const [text, setText] = useState('')
  const [panel, setPanel] = useState<null | 'members' | 'freetime' | 'poll' | 'event'>(null)
  const [attachKind, setAttachKind] = useState<'image' | 'video' | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [uploadErr, setUploadErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pickKind = useRef<'image' | 'video'>('image')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat.messages])

  const detail = chat.detail
  const othersCount = detail ? detail.members.length - 1 : 0

  async function handleSend() {
    if (!text.trim()) return
    const value = text.trim()
    setText('')
    await chat.send(value)
  }

  function pickFile(kind: 'image' | 'video') {
    setUploadErr('')
    pickKind.current = kind
    if (fileRef.current) {
      fileRef.current.accept = kind === 'image' ? 'image/*' : 'video/*'
      fileRef.current.value = ''
      fileRef.current.click()
    }
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const kind = pickKind.current
    const maxMb = kind === 'image' ? 5 : 15
    if (file.size > maxMb * 1024 * 1024) {
      setUploadErr(`That ${kind} is too large (max ${maxMb} MB).`)
      return
    }
    setUploading(true)
    setUploadErr('')
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Could not read the file.'))
        reader.readAsDataURL(file)
      })
      await chat.sendMedia(kind, dataUrl)
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  if (chat.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (chat.error || !detail) {
    return (
      <div className="space-y-4">
        <Link to="/groups" className="text-sm font-medium text-primary-600 hover:text-primary-700">← Back to groups</Link>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{chat.error ?? 'Group not found.'}</div>
      </div>
    )
  }

  const isAdmin = detail.myRole === 'admin'
  const friendsNotInGroup = friends.filter((f) => !detail.members.some((m) => m.user.id === f.user.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/groups" className="text-sm font-medium text-primary-600 hover:text-primary-700">←</Link>
        <GroupAvatar name={detail.group.name} avatarUrl={detail.group.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-900 truncate">{detail.group.name}</h1>
          <p className="text-xs text-gray-500">{detail.members.length} members</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setPanel('freetime')}>Free time</Button>
        <Button size="sm" variant="secondary" onClick={() => setPanel('members')}>Members</Button>
      </div>

      <div ref={scrollRef} className="bg-gray-50 rounded-2xl border border-gray-100 p-3 h-[55vh] overflow-y-auto space-y-2">
        {chat.messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</p>
        ) : (
          chat.messages.map((m) => (
            <MessageItem key={m.id} message={m} othersCount={othersCount} onVote={chat.votePoll} onAddEvent={chat.addEvent} />
          ))
        )}
      </div>

      {uploadErr && <p className="text-sm text-red-600">{uploadErr}</p>}

      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={onFileChosen} />
        <button onClick={() => { setUploadErr(''); setUrlValue(''); setAttachKind('image') }} disabled={uploading} title="Send a photo" className="px-2 py-2 rounded-lg hover:bg-gray-100 text-lg disabled:opacity-50">🖼️</button>
        <button onClick={() => { setUploadErr(''); setUrlValue(''); setAttachKind('video') }} disabled={uploading} title="Send a video" className="px-2 py-2 rounded-lg hover:bg-gray-100 text-lg disabled:opacity-50">🎬</button>
        <button onClick={() => setPanel('poll')} title="Create poll" className="px-2 py-2 rounded-lg hover:bg-gray-100 text-lg">📊</button>
        <button onClick={() => setPanel('event')} title="Create event" className="px-2 py-2 rounded-lg hover:bg-gray-100 text-lg">📅</button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={uploading ? 'Uploading…' : 'Type a message'}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button size="sm" onClick={handleSend}>Send</Button>
      </div>

      <Modal open={panel === 'members'} onClose={() => setPanel(null)} title="Members">
        <div className="space-y-3">
          <ul className="space-y-2">
            {detail.members.map((m) => (
              <li key={m.user.id} className="flex items-center gap-3">
                <FriendAvatar user={{ id: m.user.id, displayName: m.user.displayName, email: '', avatarUrl: m.user.avatarUrl }} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.user.displayName}{m.isSelf ? ' (you)' : ''}
                  </p>
                  <p className="text-xs text-gray-400">{m.role === 'admin' ? 'Admin' : 'Member'}</p>
                </div>
                {!m.isSelf && m.friendship === 'none' && (
                  <Button size="sm" variant="secondary" onClick={() => chat.addFriend(m.user.id)}>Add friend</Button>
                )}
                {!m.isSelf && m.friendship === 'pending' && <span className="text-xs text-gray-400">Requested</span>}
                {!m.isSelf && m.friendship === 'friends' && <span className="text-xs text-gray-400">Friend</span>}
                {isAdmin && !m.isSelf && (
                  <button onClick={() => chat.leave(m.user.id)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                )}
              </li>
            ))}
          </ul>

          {isAdmin && friendsNotInGroup.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Add a friend to this group</p>
              <div className="flex flex-wrap gap-2">
                {friendsNotInGroup.map((f) => (
                  <button
                    key={f.user.id}
                    onClick={() => chat.addMember(f.user.id)}
                    className="px-3 py-1.5 rounded-full text-sm border border-gray-300 hover:bg-gray-50"
                  >
                    + {f.user.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <Button size="sm" variant="secondary" onClick={() => chat.toggleMute(!detail.muted)}>
              {detail.muted ? '🔔 Unmute' : '🔕 Mute'}
            </Button>
            <Button size="sm" variant="danger" onClick={async () => { await chat.leave(detail.members.find((m) => m.isSelf)!.user.id); navigate('/groups') }}>
              Leave group
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={attachKind !== null}
        onClose={() => { setAttachKind(null); setUrlValue('') }}
        title={attachKind === 'video' ? 'Send a video' : 'Send a photo'}
      >
        <div className="space-y-4">
          <Button
            className="w-full"
            onClick={() => { const k = attachKind!; setAttachKind(null); pickFile(k) }}
          >
            Upload from device
          </Button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" /> or paste a link <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-2">
            <input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (!urlValue.trim()) return
                const k = attachKind!
                const u = urlValue.trim()
                setAttachKind(null)
                setUrlValue('')
                await chat.sendMedia(k, u)
              }}
            >
              Send link
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={panel === 'freetime'} onClose={() => setPanel(null)} title="Group free time">
        <GroupFreeTimePanel fetchFreeTime={chat.fetchFreeTime} />
      </Modal>

      <Modal open={panel === 'poll'} onClose={() => setPanel(null)} title="New poll">
        <PollForm onSubmit={async (q) => { await chat.createPoll(q); setPanel(null) }} onCancel={() => setPanel(null)} />
      </Modal>

      <Modal open={panel === 'event'} onClose={() => setPanel(null)} title="New event">
        <EventForm onSubmit={async (e) => { await chat.createEvent(e); setPanel(null) }} onCancel={() => setPanel(null)} />
      </Modal>
    </div>
  )
}

function PollForm({ onSubmit, onCancel }: { onSubmit: (q: string) => Promise<void>; onCancel: () => void }) {
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Members vote: 😄 I&apos;m coming · 🤔 Maybe · 😢 Sorry, I have other plans.</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="e.g. Lunch at Frontier, 1pm?"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div className="flex gap-2">
        <Button loading={saving} className="flex-1" onClick={async () => { if (!q.trim()) return; setSaving(true); try { await onSubmit(q.trim()) } finally { setSaving(false) } }}>
          Send poll
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function EventForm({ onSubmit, onCancel }: { onSubmit: (e: { title: string; day: string; startTime: string; endTime: string; venue: string }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [day, setDay] = useState('Monday')
  const [start, setStart] = useState('13:00')
  const [end, setEnd] = useState('14:00')
  const [venue, setVenue] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!title.trim()) { setErr('Title is required.'); return }
    if (start.replace(':', '') >= end.replace(':', '')) { setErr('End time must be after start.'); return }
    setSaving(true)
    setErr('')
    try {
      await onSubmit({ title: title.trim(), day, startTime: start.replace(':', ''), endTime: end.replace(':', ''), venue: venue.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title, e.g. Lunch at Frontier" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <div className="grid grid-cols-3 gap-2">
        <select value={day} onChange={(e) => setDay(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm" />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm" />
      </div>
      <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2">
        <Button loading={saving} className="flex-1" onClick={submit}>Send event</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
