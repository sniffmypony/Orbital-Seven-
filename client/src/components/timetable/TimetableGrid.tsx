import type { TimetableBlock, Day } from '@/types'
import { timeToMinutes } from '@/lib/timeUtils'
import TimetableBlockCell from './TimetableBlockCell'

const DAYS: Day[]     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const START_HOUR      = 8   // 08:00
const END_HOUR        = 22  // 22:00
const TOTAL_MINUTES   = (END_HOUR - START_HOUR) * 60
const START_MINUTES   = START_HOUR * 60
const HOUR_LABELS     = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
// 60 px per hour × 14 hours = 840 px — gives each 1-hour block enough room
// to display title, time, and venue without clipping.
const GRID_HEIGHT_PX  = 840

interface TimetableGridProps {
  blocks:   TimetableBlock[]
  onDelete: (id: string) => void
  onEdit:   (block: TimetableBlock) => void
}

function topAndHeight(block: TimetableBlock) {
  const start  = timeToMinutes(block.startTime)
  const end    = timeToMinutes(block.endTime)
  const top    = ((start - START_MINUTES) / TOTAL_MINUTES) * 100
  const height = ((end  - start)          / TOTAL_MINUTES) * 100
  return { topPercent: top, heightPercent: height }
}

export default function TimetableGrid({ blocks, onDelete, onEdit }: TimetableGridProps) {
  const LABEL_W = 'w-12'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header row */}
      <div className="flex border-b border-gray-200">
        <div className={`${LABEL_W} shrink-0`} />
        {DAYS.map((day, i) => (
          <div
            key={day}
            className="flex-1 py-2 text-center text-xs font-semibold text-gray-600 border-l border-gray-100"
          >
            {DAY_SHORT[i]}
          </div>
        ))}
      </div>

      {/* Grid body — 60 px/hour so 1-hour blocks show all three lines */}
      <div className="flex" style={{ height: `${GRID_HEIGHT_PX}px` }}>
        {/* Hour labels */}
        <div className={`${LABEL_W} shrink-0 relative`}>
          {HOUR_LABELS.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right text-xs text-gray-400 leading-none"
              style={{ top: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
            >
              {h === 12 ? '12' : h > 12 ? h - 12 : h}
              {h === 12 ? 'pm' : h >= 12 ? '' : 'am'}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => {
          const dayBlocks = blocks.filter((b) => b.day === day)
          return (
            <div key={day} className="flex-1 relative border-l border-gray-100">
              {/* Hour grid lines */}
              {HOUR_LABELS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
                />
              ))}

              {/* Blocks */}
              {dayBlocks.map((block) => {
                const { topPercent, heightPercent } = topAndHeight(block)
                return (
                  <TimetableBlockCell
                    key={block.id}
                    block={block}
                    topPercent={topPercent}
                    heightPercent={heightPercent}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
