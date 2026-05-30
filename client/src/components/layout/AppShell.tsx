import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

interface NavItem {
  label: string
  href: string
}

// Nav items will be uncommented as each milestone is completed.
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/' },
  { label: 'Timetable', href: '/timetable' },
  // M2: { label: 'Friends', href: '/friends' },
  // M3: { label: 'Free Time', href: '/free-time' },
  // M4: { label: 'Events', href: '/events' },
  // M5: { label: 'Feed', href: '/feed' },
]

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold text-primary-600 tracking-tight">
              SyncUp
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={[
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User menu */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
