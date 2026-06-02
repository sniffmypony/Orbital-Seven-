import type { TimetableBlock, Day } from '@/types'
import { timeToMinutes } from '@/lib/timeUtils'
import TimetableBlockCell from './TimetableBlockCell'

const DAYS: Day[]     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const START_HOUR      = 8
const DAY_END_HOUR    = 22
const NIGHT_END_HOUR  = 26
const START_MINUTES   = START_HOUR * 60
const PX_PER_HOUR     = 60

interface TimetableGridProps {
  blocks:    TimetableBlock[]
  onDelete?: (id: string) => void
  onEdit?:   (block: TimetableBlock) => void
  readOnly?: boolean
  nightOwl?: boolean
}

function hourLabel(h: number) {
  const hh = ((h % 24) + 24) % 24
  const period = hh < 12 ? 'am' : 'pm'
  const display = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${display}${period}`
}

export default function TimetableGrid({ blocks, onDelete, onEdit, readOnly = false, nightOwl = false }: TimetableGridProps) {
  const LABEL_W = 'w-12'

  const endHour      = nightOwl ? NIGHT_END_HOUR : DAY_END_HOUR
  const totalMinutes = (endHour - START_HOUR) * 60
  const gridHeight   = (endHour - START_HOUR) * PX_PER_HOUR
  const hourLabels   = Array.from({ length: endHour - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  const adjust = (m: number) => (nightOwl && m < START_MINUTES ? m + 1440 : m)

  function topAndHeight(block: TimetableBlock) {
    const start  = adjust(timeToMinutes(block.startTime))
    const end    = adjust(timeToMinutes(block.endTime))
    const top    = ((start - START_MINUTES) / totalMinutes) * 100
    const height = ((end - start) / totalMinutes) * 100
    return { topPercent: top, heightPercent: height }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

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

      <div className="flex" style={{ height: `${gridHeight}px` }}>

        <div className={`${LABEL_W} shrink-0 relative`}>
          {hourLabels.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right text-xs text-gray-400 leading-none"
              style={{ top: `${((h - START_HOUR) / (endHour - START_HOUR)) * 100}%` }}
            >
              {hourLabel(h)}
            </div>
          ))}
        </div>

        {DAYS.map((day) => {
          const dayBlocks = blocks.filter((b) => b.day === day)
          return (
            <div key={day} className="flex-1 relative border-l border-gray-100">

              {hourLabels.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${((h - START_HOUR) / (endHour - START_HOUR)) * 100}%` }}
                />
              ))}

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
                    readOnly={readOnly}
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
