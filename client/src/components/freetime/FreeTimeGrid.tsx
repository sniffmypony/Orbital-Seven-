import { formatTimeDisplay, timeToMinutes } from '@/lib/timeUtils'
import type { FreeTimeWindow } from '@/types'

const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const START_HOUR = 8
const END_HOUR   = 22
const TOTAL_MIN  = (END_HOUR - START_HOUR) * 60
const START_MIN  = START_HOUR * 60
const HOURS      = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const GRID_PX    = 840

interface FreeTimeGridProps {
  days: Record<string, FreeTimeWindow[]>
}

function hourLabel(h: number) {
  const period = h < 12 ? 'am' : 'pm'
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h
  return `${display}${period}`
}

export default function FreeTimeGrid({ days }: FreeTimeGridProps) {
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
          const windows = days[day] ?? []
          return (
            <div key={day} className="flex-1 relative border-l border-gray-100">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
                />
              ))}

              {windows.map((w, i) => {
                const s = timeToMinutes(w.start)
                const e = timeToMinutes(w.end)
                const top = ((s - START_MIN) / TOTAL_MIN) * 100
                const height = ((e - s) / TOTAL_MIN) * 100
                return (
                  <div
                    key={i}
                    className="absolute left-0.5 right-0.5 rounded-md bg-emerald-200/70 border-l-4 border-emerald-500 px-1.5 py-1 overflow-hidden"
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={`Free ${formatTimeDisplay(w.start)} – ${formatTimeDisplay(w.end)}`}
                  >
                    {height > 4 && (
                      <p className="text-xs font-medium text-emerald-800 leading-tight truncate">
                        {formatTimeDisplay(w.start)}–{formatTimeDisplay(w.end)}
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
