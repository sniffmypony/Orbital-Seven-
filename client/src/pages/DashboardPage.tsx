import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { getAcademicLabel, formatFullDate } from '@/lib/academicCalendar'

const CARDS = [
  { title: 'Timetable', desc: 'View and manage your weekly schedule', href: '/timetable', ready: true },
  { title: 'Friends',   desc: 'Connect with classmates',              href: '/friends',   ready: true },
  { title: 'Free Time', desc: 'Find shared free slots',               href: '/freetime',  ready: true },
  { title: 'Groups',    desc: 'Chat, polls and group events',         href: '/groups',    ready: true },
  { title: 'Profile',   desc: 'Edit your profile and defaults',       href: '/profile',   ready: true },
  { title: 'Feed',      desc: 'See what friends are up to',           href: null,         ready: false },
]

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
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm px-8 py-7 border border-gray-100">
        <p className="text-sm font-medium text-primary-600 uppercase tracking-widest mb-1">
          {fullDate}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName ?? 'there'}.
        </h1>
        {academicWeek ? (
          <span className="inline-block mt-3 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full">
            {academicWeek}
          </span>
        ) : (
          <span className="inline-block mt-3 text-sm text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
            Vacation / Orientation
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) =>
          card.ready ? (
            <Link
              key={card.title}
              to={card.href!}
              className="group bg-white rounded-2xl shadow-sm border-l-4 border-primary-500 border-t border-r border-b border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
            >
              <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {card.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
            </Link>
          ) : (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-50 cursor-not-allowed select-none"
            >
              <h2 className="font-semibold text-gray-700">{card.title}</h2>
              <p className="text-sm text-gray-400 mt-1">{card.desc}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
