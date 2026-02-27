import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { UserRole } from '@/types'
import { mockAdmins } from '@/data/mockAdmins'
import { useToast } from '@/hooks/use-toast'
import { DEMO_ADMIN_EMAILS, DEMO_ADMIN_PASSWORD, DEMO_PUBLIC_EMAIL, DEMO_PUBLIC_PASSWORD } from '@/lib/demoAuthConfig'

interface AuthState {
  isAuthenticated: boolean
  role: UserRole
  userName: string
  userEmail: string
}

interface Credentials {
  email: string
  password: string
  role: UserRole
}

interface SignupInput {
  email: string
  password: string
}

export interface AuthContextType extends AuthState {
  loginWithCredentials: (creds: Credentials) => Promise<UserRole>
  registerPublicUser: (input: SignupInput) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'nazariq:auth'
const PUBLIC_USER_STORE = 'nazariq:publicUsers'
const defaultState: AuthState = {
  isAuthenticated: false,
  role: 'public',
  userName: '',
  userEmail: '',
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadStoredAuth(): AuthState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthState
    if (typeof parsed?.role === 'string' && typeof parsed?.userName === 'string') {
      return { ...defaultState, ...parsed, isAuthenticated: true }
    }
  } catch (error) {
    console.warn('Failed to parse stored auth session', error)
  }
  return null
}

function loadPublicUsers(): SignupInput[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PUBLIC_USER_STORE)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch (error) {
    console.warn('Failed to parse stored public users', error)
  }
  return []
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [auth, setAuth] = useState<AuthState>(() => loadStoredAuth() ?? defaultState)
  const [publicUsers, setPublicUsers] = useState<SignupInput[]>(() => loadPublicUsers())

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (auth.isAuthenticated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PUBLIC_USER_STORE, JSON.stringify(publicUsers))
  }, [publicUsers])

  const loginWithCredentials = useCallback(async ({ email, password, role }: Credentials) => {
    const normalizedEmail = email.trim().toLowerCase()
    const admin = mockAdmins.find(a => a.email.toLowerCase() === normalizedEmail)

    if (role === 'admin') {
      if (!admin || !DEMO_ADMIN_EMAILS.includes(normalizedEmail)) {
        throw new Error('Email is not registered as an admin')
      }
      if (password !== DEMO_ADMIN_PASSWORD) throw new Error('Invalid admin password')
      setAuth({ isAuthenticated: true, role: 'admin', userName: admin.name, userEmail: admin.email })
      toast({ title: `Welcome back, ${admin.name}`, description: 'Admin access granted' })
      return 'admin'
    }

    if (role === 'public') {
      const storedUser = publicUsers.find(user => user.email.toLowerCase() === normalizedEmail)
      const isDemoPublic = normalizedEmail === DEMO_PUBLIC_EMAIL
      if (!storedUser && !isDemoPublic) {
        throw new Error('Email is not registered as a public account')
      }
      const expectedPassword = storedUser ? storedUser.password : DEMO_PUBLIC_PASSWORD
      if (password !== expectedPassword) throw new Error('Invalid public password')
      const nameToken = normalizedEmail.split('@')[0] ?? 'Public User'
      const formattedName = nameToken
        .replace(/\./g, ' ')
        .replace(/(^|\s)\w/g, match => match.toUpperCase())
      setAuth({ isAuthenticated: true, role: 'public', userName: formattedName, userEmail: email })
      toast({ title: 'Welcome to NazarIQ', description: 'Public access granted' })
      return 'public'
    }

    throw new Error('Account not recognized')
  }, [publicUsers, toast])

  const registerPublicUser = useCallback(async ({ email, password }: SignupInput) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (publicUsers.some(user => user.email.toLowerCase() === normalizedEmail) || normalizedEmail === DEMO_PUBLIC_EMAIL) {
      throw new Error('This email is already registered')
    }
    setPublicUsers(prev => [...prev, { email: normalizedEmail, password }])
    toast({ title: 'Account created', description: 'You can now sign in as a public user.' })
  }, [publicUsers, toast])

  const logout = useCallback(() => {
    setAuth(defaultState)
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, loginWithCredentials, registerPublicUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
