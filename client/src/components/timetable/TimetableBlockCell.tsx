import type { TimetableBlock } from '@/types'
import { formatTimeDisplay, timeToMinutes } from '@/lib/timeUtils'

interface TimetableBlockCellProps {
  block:         TimetableBlock
  topPercent:    number
  heightPercent: number
  onDelete:      (id: string) => void
  onEdit:        (block: TimetableBlock) => void
}

export default function TimetableBlockCell({
  block,
  topPercent,
  heightPercent,
  onDelete,
  onEdit,
}: TimetableBlockCellProps) {
  // Use actual duration in minutes so the threshold is independent of grid scale.
  const durationMin = timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
  const isShort     = durationMin < 45   // < 45 min → condensed (title only)

  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden group cursor-default select-none"
      style={{
        top:        `${topPercent}%`,
        height:     `${heightPercent}%`,
        backgroundColor: block.color + '33', // 20 % opacity fill
        borderLeft: `3px solid ${block.color}`,
      }}
    >
      <p
        className="text-xs font-semibold leading-tight truncate"
        style={{ color: block.color }}
      >
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

      {/* Edit button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(block) }}
        className="absolute top-1 right-6 hidden group-hover:flex w-4 h-4 items-center justify-center rounded bg-white/80 text-gray-500 hover:text-blue-500 text-xs leading-none"
        title="Edit block"
      >
        ✎
      </button>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
        className="absolute top-1 right-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded bg-white/80 text-gray-500 hover:text-red-500 text-xs leading-none"
        title="Remove block"
      >
        ✕
      </button>
    </div>
  )
}
