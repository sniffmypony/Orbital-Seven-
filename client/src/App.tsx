import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { ThemeProvider } from '@/lib/theme'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import TimetablePage from '@/pages/TimetablePage'
import FriendsPage from '@/pages/FriendsPage'
import FriendTimetablePage from '@/pages/FriendTimetablePage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SignedIn>
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/friends/:friendId/timetable" element={<FriendTimetablePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </SignedIn>
        <SignedOut>
          <Routes>
            <Route path="*" element={<RedirectToSignIn />} />
          </Routes>
        </SignedOut>
      </BrowserRouter>
    </ThemeProvider>
  )
}
