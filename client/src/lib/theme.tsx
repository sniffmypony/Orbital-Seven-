import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ThemeContextValue {
  nightOwl: boolean
  setNightOwl: (value: boolean) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'syncup.nightOwl'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [nightOwl, setNightOwl] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(nightOwl))
    } catch {
      void 0
    }
    document.documentElement.classList.toggle('night-owl', nightOwl)
  }, [nightOwl])

  const value: ThemeContextValue = {
    nightOwl,
    setNightOwl,
    toggle: () => setNightOwl((v) => !v),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
