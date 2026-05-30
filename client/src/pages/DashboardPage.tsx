import { useUser } from '@clerk/clerk-react'
import { getAcademicLabel, formatFullDate } from '@/lib/academicCalendar'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()

  const today        = new Date()
  const fullDate     = formatFullDate(today)
  const academicWeek = getAcademicLabel(today)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName ?? 'there'}!
        </h1>

        
        <p className="mt-1 text-gray-700 font-medium">{fullDate}</p>
        {academicWeek && (
          <span className="inline-block mt-1 text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-0.5 rounded-full">
            {academicWeek}
          </span>
        )}
        {!academicWeek && (
          <span className="inline-block mt-1 text-sm text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full">
            Vacation / Orientation
          </span>
        )}
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Timetable', desc: 'Import your NUSMods timetable',  ready: false },
          { title: 'Friends',   desc: 'Connect with classmates',         ready: false },
          { title: 'Free Time', desc: 'Find shared free slots',          ready: false },
          { title: 'Events',    desc: 'Plan and vote on meetups',        ready: false },
          { title: 'Feed',      desc: 'See what friends are up to',      ready: false },
          { title: 'Settings',  desc: 'Control your privacy',            ready: false },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-5 opacity-60 cursor-not-allowed"
          >
            <h2 className="font-semibold text-gray-900">{card.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
