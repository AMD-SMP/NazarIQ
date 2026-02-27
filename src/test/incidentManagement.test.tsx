import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import IncidentManagement from '@/pages/admin/IncidentManagement'
import type { Incident } from '@/types'
import type { AuthContextType } from '@/context/AuthContext'
import { mockIncidents } from '@/data/mockIncidents'

const toastSpy = vi.fn()
const updateIncidentMock = vi.fn()
const bulkUpdateIncidentsMock = vi.fn()

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}))

const filtersState: { current: { filteredIncidents: Incident[] } } = {
  current: { filteredIncidents: [] },
}

vi.mock('@/context/FilterContext', () => ({
  useFilters: () => filtersState.current,
}))

const authState: { current: AuthContextType } = {
  current: {
    isAuthenticated: true,
    role: 'admin',
    userName: 'Admin',
    userEmail: 'admin@example.com',
    loginWithCredentials: vi.fn(),
    registerPublicUser: vi.fn(),
    logout: vi.fn(),
  },
}

vi.mock('@/context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/context/AuthContext')>('@/context/AuthContext')
  return {
    ...actual,
    useAuth: () => authState.current,
  }
})

vi.mock('@/lib/adminApi', () => ({
  adminApi: {
    alerts: vi.fn(),
    activity: vi.fn(),
    markAlertRead: vi.fn(),
    dismissAlert: vi.fn(),
    updateIncident: (...args: Parameters<typeof updateIncidentMock>) => updateIncidentMock(...args),
    bulkUpdateIncidents: (...args: Parameters<typeof bulkUpdateIncidentsMock>) => bulkUpdateIncidentsMock(...args),
  },
}))

const activeClients = new Set<QueryClient>()

function createTestClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  activeClients.add(client)
  return client
}

function renderIncidentManagement() {
  const client = createTestClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <IncidentManagement />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function buildIncident(overrides: Partial<Incident>): Incident {
  return {
    ...mockIncidents[0],
    ...overrides,
  }
}

beforeEach(() => {
  toastSpy.mockReset()
  updateIncidentMock.mockReset()
  bulkUpdateIncidentsMock.mockReset()
  authState.current = {
    isAuthenticated: true,
    role: 'admin',
    userName: 'Commander',
    userEmail: 'admin@nazarIQ.gov',
    loginWithCredentials: vi.fn(),
    registerPublicUser: vi.fn(),
    logout: vi.fn(),
  }
  filtersState.current = { filteredIncidents: [] }
})

afterEach(() => {
  cleanup()
  activeClients.forEach(client => {
    client.clear()
    client.getQueryCache().clear()
  })
  activeClients.clear()
})

describe('IncidentManagement RBAC', () => {
  it('hides status controls for non-admin users', () => {
    authState.current = {
      ...authState.current,
      role: 'public',
    }
    filtersState.current = {
      filteredIncidents: [buildIncident({ id: 'INC-1', status: 'DETECTED' })],
    }

    renderIncidentManagement()

    expect(screen.queryByRole('combobox')).toBeNull()
  })
})

describe('IncidentManagement mutations', () => {
  it('submits single incident status updates for admins', async () => {
    const incident = buildIncident({ id: 'INC-77', status: 'DETECTED' })
    filtersState.current = { filteredIncidents: [incident] }
    updateIncidentMock.mockResolvedValue({ ...incident, status: 'IN_PROGRESS' })

    renderIncidentManagement()

    const select = await screen.findByDisplayValue('DETECTED')
    fireEvent.change(select, { target: { value: 'IN_PROGRESS' } })

    await waitFor(() => {
      expect(updateIncidentMock).toHaveBeenCalledWith('INC-77', { status: 'IN_PROGRESS' })
    })

    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining('Incident updated successfully'),
    }))
  })

  it('invokes the bulk status endpoint and surfaces success toasts', async () => {
    const first = buildIncident({ id: 'INC-101', status: 'DETECTED' })
    const second = buildIncident({ id: 'INC-202', status: 'ALERTED' })
    filtersState.current = { filteredIncidents: [first, second] }
    bulkUpdateIncidentsMock.mockResolvedValue({ data: [], updated: 2, errors: [] })

    renderIncidentManagement()

    const [, firstRowCheckbox, secondRowCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(firstRowCheckbox)
    fireEvent.click(secondRowCheckbox)

    await screen.findByText(/incidents selected/i)

    const bulkButton = screen.getByRole('button', { name: /mark in progress/i })
    fireEvent.click(bulkButton)

    await waitFor(() => {
      expect(bulkUpdateIncidentsMock).toHaveBeenCalledTimes(1)
    })

    const [idsArg, payloadArg] = bulkUpdateIncidentsMock.mock.calls[0] ?? []
    expect(new Set(idsArg as string[])).toEqual(new Set(['INC-101', 'INC-202']))
    expect(payloadArg).toEqual({ status: 'IN_PROGRESS' })

    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining('Bulk update complete'),
    }))
  })
})
