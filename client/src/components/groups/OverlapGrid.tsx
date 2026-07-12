import { formatTimeDisplay, timeToMinutes } from '@/lib/timeUtils'
import type { OverlapSegment } from '@/types'

const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const START_HOUR = 8
const END_HOUR   = 22
const TOTAL_MIN  = (END_HOUR - START_HOUR) * 60
const START_MIN  = START_HOUR * 60
const HOURS      = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const GRID_PX    = 840

interface OverlapGridProps {
  days: Record<string, OverlapSegment[]>
}

function hourLabel(h: number) {
  const period = h < 12 ? 'am' : 'pm'
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h
  return `${display}${period}`
}

function tooltipFor(seg: OverlapSegment) {
  if (seg.busy.length === 0) return 'Everyone selected is free'
  return seg.busy
    .map((b) => `${b.name}: ${b.title}${b.venue ? ` @ ${b.venue}` : ''}`)
    .join('\n')
}

export default function OverlapGrid({ days }: OverlapGridProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <div className="w-12 shrink-0" />
        {DAYS.map((day, i) => (
          <div key={day} className="flex-1 py-2 text-center text-xs font-semibold text-gray-600 border-l border-gray-100">
            {DAY_SHORT[i]}
          </div>
        ))}
      </div>

      <div className="flex" style={{ height: `${GRID_PX}px` }}>
        <div className="w-12 shrink-0 relative">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right text-xs text-gray-400 leading-none"
              style={{ top: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
            >
              {hourLabel(h)}
            </div>
          ))}
        </div>

        {DAYS.map((day) => {
          const segments = days[day] ?? []
          return (
            <div key={day} className="flex-1 relative border-l border-gray-100">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
                />
              ))}

              {segments.map((seg, i) => {
                const s = timeToMinutes(seg.start)
                const e = timeToMinutes(seg.end)
                const top = ((s - START_MIN) / TOTAL_MIN) * 100
                const height = ((e - s) / TOTAL_MIN) * 100
                const free = seg.busy.length === 0
                return (
                  <div
                    key={i}
                    title={tooltipFor(seg)}
                    className={[
                      'absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden border-l-4',
                      free
                        ? 'bg-emerald-200/70 border-emerald-500'
                        : 'bg-rose-200/70 border-rose-500',
                    ].join(' ')}
                    style={{ top: `${top}%`, height: `${height}%` }}
                  >
                    {height > 3.5 && (
                      <p className={`text-xs font-medium leading-tight truncate ${free ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {free
                          ? `${formatTimeDisplay(seg.start)}–${formatTimeDisplay(seg.end)}`
                          : `${seg.busy.length} busy`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
