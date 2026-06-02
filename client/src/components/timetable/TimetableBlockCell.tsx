import type { TimetableBlock, BlockVisibility } from '@/types'
import { formatTimeDisplay, timeToMinutes } from '@/lib/timeUtils'

const VISIBILITY_BADGE: Record<BlockVisibility, { icon: string; label: string }> = {
  private: { icon: '🔒', label: 'Private — only you can see this' },
  friends: { icon: '👥', label: 'Visible to all your friends' },
  only:    { icon: '🔑', label: 'Visible to only selected friends' },
  except:  { icon: '🙈', label: 'Hidden from selected friends' },
}

interface TimetableBlockCellProps {
  block:         TimetableBlock
  topPercent:    number
  heightPercent: number
  onDelete?:     (id: string) => void
  onEdit?:       (block: TimetableBlock) => void
  readOnly?:     boolean
}

export default function TimetableBlockCell({
  block,
  topPercent,
  heightPercent,
  onDelete,
  onEdit,
  readOnly = false,
}: TimetableBlockCellProps) {

  const durationMin = timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
  const isShort     = durationMin < 45

  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden group cursor-default select-none"
      style={{
        top:        `${topPercent}%`,
        height:     `${heightPercent}%`,
        backgroundColor: block.color + '33',
        borderLeft: `3px solid ${block.color}`,
      }}
      title={block.note ? `Note: ${block.note}` : undefined}
    >
      <p
        className="text-xs font-semibold leading-tight truncate"
        style={{ color: block.color }}
      >
        {block.note && <span className="mr-0.5">📝</span>}
        {block.title}
      </p>

      {!isShort && (
        <p className="text-xs text-gray-500 leading-tight truncate">
          {formatTimeDisplay(block.startTime)}–{formatTimeDisplay(block.endTime)}
        </p>
      )}

      {!isShort && block.venue && (
        <p className="text-xs text-gray-400 leading-tight truncate">{block.venue}</p>
      )}

      {!isShort && block.note && (
        <p className="text-xs italic text-gray-600 leading-tight truncate">{block.note}</p>
      )}

      {!readOnly && onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(block) }}
          className="absolute top-1 right-6 hidden group-hover:flex w-4 h-4 items-center justify-center rounded bg-white/80 text-gray-500 hover:text-blue-500 text-xs leading-none"
          title="Edit block"
        >
          ✎
        </button>
      )}

      {!readOnly && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
          className="absolute top-1 right-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded bg-white/80 text-gray-500 hover:text-red-500 text-xs leading-none"
          title="Remove block"
        >
          ✕
        </button>
      )}

      {!readOnly && (
        <span
          className="absolute bottom-0.5 right-1 text-[10px] leading-none opacity-80"
          title={VISIBILITY_BADGE[block.visibility].label}
        >
          {VISIBILITY_BADGE[block.visibility].icon}
        </span>
      )}
    </div>
  )
}
