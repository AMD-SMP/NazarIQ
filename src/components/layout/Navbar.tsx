import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useThemeContext } from '@/context/ThemeContext'
import type { Theme } from '@/types'

export function Navbar() {
  const { isAuthenticated, role, userName, logout } = useAuth()
  const { theme, setTheme } = useThemeContext()
  const location = useLocation()
  const navigate = useNavigate()

  const themes: { key: Theme; label: string; icon: string }[] = [
    { key: 'command', label: 'Command', icon: '🌑' },
    { key: 'municipal', label: 'Municipal', icon: '☀️' },
    { key: 'contrast', label: 'High Contrast', icon: '◐' },
  ]

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4">
      <Link to="/" className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <span className="font-heading text-lg font-bold text-foreground">
          Nazar<sup className="text-primary text-xs">IQ</sup>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/trends', label: 'Trends' },
          ...(role === 'admin' ? [
            { to: '/admin', label: 'Ops Center' },
            { to: '/admin/incidents', label: 'Manage' },
          ] : []),
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              location.pathname === link.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* Theme switcher */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {themes.map(t => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              title={t.label}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                theme === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{userName}</span>
            <button onClick={logout} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
