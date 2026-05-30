

interface Lesson {
  classNo:   string
  day:       string
  startTime: string
  endTime:   string
  venue:     string
}

interface ClassSlotSelectorProps {
  lessonTypes: Record<string, Lesson[]>
  selected:    Record<string, string>
  onChange:    (lessonType: string, classNo: string) => void
}

function formatTime(t: string): string {
  const h = parseInt(t.slice(0, 2), 10)
  const m = t.slice(2, 4)
  return `${h > 12 ? h - 12 : h}:${m}${h >= 12 ? 'pm' : 'am'}`
}

export default function ClassSlotSelector({ lessonTypes, selected, onChange }: ClassSlotSelectorProps) {

  const uniqueByClassNo = (lessons: Lesson[]) => {
    const seen = new Set<string>()
    return lessons.filter((l) => { if (seen.has(l.classNo)) return false; seen.add(l.classNo); return true })
  }

  return (
    <div className="space-y-4">
      {Object.entries(lessonTypes).map(([lessonType, lessons]) => (
        <div key={lessonType}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {lessonType}
          </p>
          <div className="flex flex-col gap-1">
            {uniqueByClassNo(lessons).map((lesson) => {

              const allSlots = lessons.filter((l) => l.classNo === lesson.classNo)
              const isSelected = selected[lessonType] === lesson.classNo

              return (
                <button
                  key={lesson.classNo}
                  onClick={() => onChange(lessonType, lesson.classNo)}
                  className={[
                    'flex items-start gap-3 rounded-lg px-3 py-2 border text-left transition-colors text-sm',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700',
                  ].join(' ')}
                >
                  <span className="font-mono font-semibold text-xs mt-0.5 shrink-0">
                    {lesson.classNo}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    {allSlots.map((s, i) => (
                      <span key={i} className="text-xs text-gray-500">
                        {s.day} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                        {s.venue ? ` · ${s.venue}` : ''}
                      </span>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
