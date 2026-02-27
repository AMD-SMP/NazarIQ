import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AdminRoute } from '@/routes/AdminRoute'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import { useAuth, type AuthContextType } from '@/context/AuthContext'
import { adminApi } from '@/lib/adminApi'
import { incidentsApi } from '@/lib/incidentsApi'
import { mockAlerts } from '@/data/mockAlerts'
import { mockActivityLog } from '@/data/mockActivityLog'
import { mockIncidents } from '@/data/mockIncidents'

vi.mock('@/context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/context/AuthContext')>('@/context/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

vi.mock('@/components/map/MapSimulation', () => ({
  MapSimulation: () => <div data-testid="map-sim" />,
}))

vi.mock('@/components/charts/ResolutionGauge', () => ({
  ResolutionGauge: () => <div data-testid="resolution-gauge" />,
}))

vi.mock('@/lib/adminApi', () => ({
  adminApi: {
    alerts: vi.fn(),
    activity: vi.fn(),
    markAlertRead: vi.fn(),
    dismissAlert: vi.fn(),
  },
}))

vi.mock('@/lib/incidentsApi', () => ({
  incidentsApi: {
    list: vi.fn(),
  },
}))

const useAuthMock = vi.mocked(useAuth)
const adminApiMock = vi.mocked(adminApi)
const incidentsApiMock = vi.mocked(incidentsApi)

const activeClients = new Set<QueryClient>()

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderAdminRoute(initialEntry = '/admin') {
  const client = createTestClient()
  activeClients.add(client)

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route path="/" element={<div>Public Landing</div>} />
          <Route
            path="/admin"
            element={(
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function createAuthState(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    isAuthenticated: false,
    role: 'public',
    userName: '',
    userEmail: '',
    loginWithCredentials: vi.fn(),
    registerPublicUser: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  adminApiMock.alerts.mockResolvedValue(mockAlerts)
  adminApiMock.activity.mockResolvedValue(mockActivityLog)
  adminApiMock.markAlertRead.mockResolvedValue(mockAlerts[0])
  adminApiMock.dismissAlert.mockResolvedValue()
  incidentsApiMock.list.mockResolvedValue({ data: mockIncidents })
})

afterEach(() => {
  cleanup()
  activeClients.forEach(client => client.clear())
  activeClients.clear()
})

describe('AdminRoute RBAC', () => {
  it('redirects unauthenticated users to /login', async () => {
    useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: false }))

    renderAdminRoute()

    expect(await screen.findByText(/login screen/i)).toBeInTheDocument()
  })

  it('redirects public users to the main dashboard', async () => {
    useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: true, role: 'public', userName: 'Citizen User' }))

    renderAdminRoute()

    expect(await screen.findByText(/public landing/i)).toBeInTheDocument()
  })

  it('allows admins to view the operations center', async () => {
    const adminName = 'Commander Rao'
    useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: true, role: 'admin', userName: adminName }))

    renderAdminRoute()

    expect(await screen.findByText('Operations Center')).toBeInTheDocument()
    expect(await screen.findByText(mockIncidents[0].title)).toBeInTheDocument()
  })
})

describe('Admin dashboard data failures', () => {
  it('surfaces incidents fetch errors in the priority queue panel', async () => {
    useAuthMock.mockReturnValue(createAuthState({ isAuthenticated: true, role: 'admin', userName: 'Commander Rao' }))
    incidentsApiMock.list.mockRejectedValueOnce(new Error('Server offline'))

    renderAdminRoute()

    const errorMessages = await screen.findAllByText(/server offline/i)
    expect(errorMessages.length).toBeGreaterThan(0)
  })
})
