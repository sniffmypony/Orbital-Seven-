import { useState } from 'react'
import { formatTimeDisplay } from '@/lib/timeUtils'
import Button from '@/components/ui/Button'
import type { ChatMessage } from '@/types'

interface MessageItemProps {
  message: ChatMessage
  othersCount: number
  canModerate: boolean
  onVote: (pollId: string, optionId: string) => void
  onRetract: (pollId: string) => void
  onAddOption: (pollId: string, label: string) => void
  onAddEvent: (eventId: string, recurrence: 'once' | 'weeks' | 'never', weeks: number) => Promise<void>
  onDelete: (messageId: string) => void
  onInfo: (message: ChatMessage) => void
  onSenderClick: (userId: string) => void
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageItem({ message, othersCount, canModerate, onVote, onRetract, onAddOption, onAddEvent, onDelete, onInfo, onSenderClick }: MessageItemProps) {
  const mine = message.mine
  const allRead = othersCount > 0 && message.readBy.length >= othersCount
  const canDelete = mine || canModerate
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-sm"
            style={{ top: menu.y, left: menu.x }}
          >
            <button
              onClick={() => { setMenu(null); onInfo(message) }}
              className="block w-full text-left px-4 py-1.5 hover:bg-gray-100 text-gray-700"
            >
              ℹ️ Info
            </button>
            {canDelete && (
              <button
                onClick={() => { setMenu(null); if (window.confirm('Delete this message for everyone?')) onDelete(message.id) }}
                className="block w-full text-left px-4 py-1.5 hover:bg-gray-100 text-red-600"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </>
      )}
      <div
        onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}
        className={`max-w-[78%] rounded-2xl px-3 py-2 cursor-default ${mine ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
      >
        {!mine && (
          <button
            onClick={() => onSenderClick(message.sender.id)}
            className="block text-xs font-semibold text-primary-600 mb-0.5 hover:underline"
            title={`View ${message.sender.displayName}'s timetable`}
          >
            {message.sender.displayName}
          </button>
        )}

        {message.kind === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}

        {message.kind === 'image' && message.mediaUrl && (
          <img src={message.mediaUrl} alt="shared" className="rounded-lg max-h-64 object-cover" />
        )}

        {message.kind === 'video' && message.mediaUrl && (
          <video src={message.mediaUrl} controls className="rounded-lg max-h-64" />
        )}

        {message.poll && (
          <PollCard message={message} onVote={onVote} onRetract={onRetract} onAddOption={onAddOption} mine={mine} />
        )}

        {message.event && <EventCard message={message} onAddEvent={onAddEvent} mine={mine} />}

        <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : ''}`}>
          <span className={`text-[10px] ${mine ? 'text-primary-100' : 'text-gray-400'}`}>{timeLabel(message.createdAt)}</span>
          {mine && (
            <span className={`text-[11px] leading-none ${allRead ? 'text-sky-300' : 'text-primary-200'}`} title={allRead ? 'Read by everyone' : 'Delivered'}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function PollCard({
  message, onVote, onRetract, onAddOption, mine,
}: {
  message: ChatMessage
  onVote: (p: string, optionId: string) => void
  onRetract: (p: string) => void
  onAddOption: (p: string, label: string) => void
  mine: boolean
}) {
  const poll = message.poll!
  const total = poll.options.reduce((sum, o) => sum + o.voters.length, 0)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')

  return (
    <div className={`rounded-lg p-2 ${mine ? 'bg-primary-500/40' : 'bg-gray-50'}`}>
      <p className="text-sm font-semibold mb-2">📊 {poll.question}</p>
      <div className="space-y-1.5">
        {poll.options.map((o) => {
          const picked = poll.myVote === o.id
          return (
            <button
              key={o.id}
              onClick={() => (picked ? onRetract(poll.id) : onVote(poll.id, o.id))}
              title={o.voters.length ? o.voters.join(', ') : 'No votes yet'}
              className={[
                'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm border transition-colors',
                picked
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : mine ? 'bg-white/80 border-white/60 text-gray-800 hover:bg-white' : 'bg-white border-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              <span className="text-left">{o.label}{picked ? ' ✓' : ''}</span>
              <span className="text-xs font-semibold">{o.voters.length}</span>
            </button>
          )
        })}
      </div>

      {adding ? (
        <div className="flex gap-1.5 mt-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="How about 2pm instead..."
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800"
          />
          <button
            onClick={() => { if (label.trim()) { onAddOption(poll.id, label.trim()); setLabel(''); setAdding(false) } }}
            className="px-2 py-1 rounded-md bg-primary-600 text-white text-xs"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className={`text-xs mt-2 underline ${mine ? 'text-primary-100' : 'text-primary-600'}`}
        >
          + Propose another option
        </button>
      )}

      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-100' : 'text-gray-400'}`}>
        {total} vote{total === 1 ? '' : 's'} · tap your choice again to undo
      </p>
    </div>
  )
}

function EventCard({ message, onAddEvent, mine }: { message: ChatMessage; onAddEvent: MessageItemProps['onAddEvent']; mine: boolean }) {
  const event = message.event!
  const [open, setOpen] = useState(false)
  const [recurrence, setRecurrence] = useState<'once' | 'weeks' | 'never'>('once')
  const [weeks, setWeeks] = useState(4)
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState(false)

  async function add() {
    setSaving(true)
    try {
      await onAddEvent(event.id, recurrence, weeks)
      setAdded(true)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-lg p-2 ${mine ? 'bg-primary-500/40' : 'bg-gray-50'}`}>
      <p className="text-sm font-semibold">📅 {event.title}</p>
      <p className={`text-xs ${mine ? 'text-primary-50' : 'text-gray-600'}`}>
        {event.day}, {formatTimeDisplay(event.startTime)}–{formatTimeDisplay(event.endTime)}
        {event.venue ? ` · ${event.venue}` : ''}
      </p>

      {added ? (
        <p className="text-xs mt-2 text-emerald-300">Added to your timetable ✓</p>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className={`text-xs font-semibold mt-2 underline ${mine ? 'text-white' : 'text-primary-600'}`}>
          Add to my timetable
        </button>
      ) : (
        <div className="mt-2 space-y-2 bg-white rounded-md p-2 text-gray-800">
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as 'once' | 'weeks' | 'never')}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
          >
            <option value="once">One-time</option>
            <option value="weeks">Recurring for a number of weeks</option>
            <option value="never">Recurring (whole semester)</option>
          </select>
          {recurrence === 'weeks' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Stop after</span>
              <input
                type="number"
                min={1}
                max={13}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-16 border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
              <span className="text-xs text-gray-600">weeks</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={add}>Add</Button>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
