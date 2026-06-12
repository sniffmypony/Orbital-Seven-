import { useState } from 'react'
import { formatTimeDisplay } from '@/lib/timeUtils'
import Button from '@/components/ui/Button'
import type { ChatMessage } from '@/types'

const POLL_META: Record<string, { emoji: string; label: string }> = {
  coming: { emoji: '😄', label: "I'm coming!" },
  maybe:  { emoji: '🤔', label: 'Maybe' },
  cant:   { emoji: '😢', label: 'Sorry, I have other plans' },
}

interface MessageItemProps {
  message: ChatMessage
  othersCount: number
  onVote: (pollId: string, choice: string) => void
  onAddEvent: (eventId: string, recurrence: 'once' | 'weeks' | 'never', weeks: number) => Promise<void>
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageItem({ message, othersCount, onVote, onAddEvent }: MessageItemProps) {
  const mine = message.mine
  const allRead = othersCount > 0 && message.readBy.length >= othersCount

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${mine ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
        {!mine && <p className="text-xs font-semibold text-primary-600 mb-0.5">{message.sender.displayName}</p>}

        {message.kind === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}

        {message.kind === 'image' && message.mediaUrl && (
          <img src={message.mediaUrl} alt="shared" className="rounded-lg max-h-64 object-cover" />
        )}

        {message.kind === 'video' && message.mediaUrl && (
          <video src={message.mediaUrl} controls className="rounded-lg max-h-64" />
        )}

        {message.poll && <PollCard message={message} onVote={onVote} mine={mine} />}

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

function PollCard({ message, onVote, mine }: { message: ChatMessage; onVote: (p: string, c: string) => void; mine: boolean }) {
  const poll = message.poll!
  const total = poll.options.reduce((sum, o) => sum + o.voters.length, 0)
  return (
    <div className={`rounded-lg p-2 ${mine ? 'bg-primary-500/40' : 'bg-gray-50'}`}>
      <p className="text-sm font-semibold mb-2">📊 {poll.question}</p>
      <div className="space-y-1.5">
        {poll.options.map((o) => {
          const meta = POLL_META[o.choice]
          const picked = poll.myVote === o.choice
          return (
            <button
              key={o.choice}
              onClick={() => onVote(poll.id, o.choice)}
              title={o.voters.join(', ')}
              className={[
                'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm border transition-colors',
                picked
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : mine ? 'bg-white/80 border-white/60 text-gray-800 hover:bg-white' : 'bg-white border-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              <span>{meta.emoji} {meta.label}</span>
              <span className="text-xs font-semibold">{o.voters.length}</span>
            </button>
          )
        })}
      </div>
      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-100' : 'text-gray-400'}`}>{total} vote{total === 1 ? '' : 's'}</p>
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
