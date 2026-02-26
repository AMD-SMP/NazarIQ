import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Theme } from '@/types'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('command')

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  // Apply theme class to both <html> and <body> so CSS variables cascade everywhere
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    // Remove all theme classes
    root.classList.remove('theme-command', 'theme-municipal', 'theme-contrast')
    body.classList.remove('theme-command', 'theme-municipal', 'theme-contrast')
    // Add current theme class
    root.classList.add(`theme-${theme}`)
    body.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider')
  return ctx
}
