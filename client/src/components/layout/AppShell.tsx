import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useTheme } from '@/lib/theme'
import { useNotifications } from '@/hooks/useNotifications'
import SceneryBackground from './SceneryBackground'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Timetable', href: '/timetable' },
  { label: 'Friends',   href: '/friends' },
  { label: 'Free Time', href: '/freetime' },
  { label: 'Groups',    href: '/groups' },
  { label: 'Profile',   href: '/profile' },
]

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const { nightOwl } = useTheme()
  const notif = useNotifications()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const badgeFor = (href: string) =>
    href === '/friends' ? notif.friendRequests : href === '/groups' ? notif.groupsUnread : 0

  const headerClass = nightOwl
    ? 'bg-slate-900/90 backdrop-blur border-t-4 border-violet-500 shadow-lg'
    : 'bg-white/90 backdrop-blur border-t-4 border-primary-500 shadow-sm'

  return (
    <div className="min-h-screen transition-colors duration-[1600ms]">
      <SceneryBackground />

      <header className={`${headerClass} sticky top-0 z-10 transition-colors duration-[1600ms]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <Link to="/" className="text-xl font-bold tracking-tight">
              <span className={nightOwl ? 'text-white' : 'text-gray-900'}>Sync</span>
              <span className={nightOwl ? 'text-violet-400' : 'text-primary-600'}>Up</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={[
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive(item.href)
                      ? nightOwl
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-primary-600 text-white shadow-sm'
                      : nightOwl
                        ? 'text-slate-300 hover:text-white hover:bg-white/10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {item.label}
                  {badgeFor(item.href) > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {badgeFor(item.href)}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl bg-white/65 backdrop-blur-md shadow-xl px-5 py-6 sm:px-8 sm:py-8 transition-colors duration-[1600ms]">
          {children}
        </div>
      </main>
    </div>
  )
}
