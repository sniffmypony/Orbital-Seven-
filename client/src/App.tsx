import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import TimetablePage from '@/pages/TimetablePage'

export default function App() {
  return (
    <BrowserRouter>
      <SignedIn>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
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
  )
}
