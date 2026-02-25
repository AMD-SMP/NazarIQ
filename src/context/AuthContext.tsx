import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { UserRole } from '@/types'
import { mockAdmins } from '@/data/mockAdmins'
import { useToast } from '@/hooks/use-toast'

interface AuthState {
  isAuthenticated: boolean
  role: UserRole
  userName: string
  userEmail: string
}

interface AuthContextType extends AuthState {
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: 'public',
    userName: '',
    userEmail: '',
  })

  const login = useCallback((role: UserRole) => {
    if (role === 'admin') {
      const admin = mockAdmins[0]
      setAuth({ isAuthenticated: true, role: 'admin', userName: admin.name, userEmail: admin.email })
      toast({ title: `Welcome back, ${admin.name}`, description: 'Admin access granted' })
    } else {
      setAuth({ isAuthenticated: true, role: 'public', userName: 'Public User', userEmail: '' })
      toast({ title: 'Welcome to NazarIQ', description: 'Viewing public dashboard' })
    }
  }, [toast])

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, role: 'public', userName: '', userEmail: '' })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
