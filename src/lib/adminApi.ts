import { apiClient } from '@/lib/apiClient'
import { incidentsApi } from '@/lib/incidentsApi'
import { mockAlerts } from '@/data/mockAlerts'
import { mockActivityLog } from '@/data/mockActivityLog'
import type { Alert, ActivityLog, AdminBulkUpdateResponse, Incident, IncidentUpdateRequest } from '@/types'

const hasRemoteApi = Boolean(import.meta.env.VITE_API_BASE_URL)
let alertsStore = [...mockAlerts]

function sanitizeUpdates(updates: IncidentUpdateRequest) {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as IncidentUpdateRequest
}

export const adminApi = {
  async alerts(): Promise<Alert[]> {
    if (!hasRemoteApi) return alertsStore
    return apiClient.get<Alert[]>('/admin/alerts')
  },
  async activity(range: '7D' | '30D' | '90D' = '30D'): Promise<ActivityLog[]> {
    if (!hasRemoteApi) return mockActivityLog
    const params = new URLSearchParams({ dateRange: range })
    const query = params.toString()
    return apiClient.get<ActivityLog[]>(`/admin/activity${query ? `?${query}` : ''}`)
  },
  async markAlertRead(id: string): Promise<Alert> {
    if (!hasRemoteApi) {
      alertsStore = alertsStore.map(alert => alert.id === id ? { ...alert, status: 'ACKNOWLEDGED' } : alert)
      const updated = alertsStore.find(alert => alert.id === id)
      if (!updated) throw new Error('Alert not found')
      return updated
    }
    return apiClient.patch<Alert>(`/admin/alerts/${id}`, { status: 'ACKNOWLEDGED' })
  },
  async dismissAlert(id: string): Promise<void> {
    if (!hasRemoteApi) {
      alertsStore = alertsStore.filter(alert => alert.id !== id)
      return
    }
    await apiClient.delete<void>(`/admin/alerts/${id}`)
  },
  async updateIncident(id: string, updates: IncidentUpdateRequest): Promise<Incident> {
    const payload = sanitizeUpdates(updates)
    if (!Object.keys(payload).length) {
      throw new Error('No updates provided')
    }
    return incidentsApi.update(id, payload)
  },
  async bulkUpdateIncidents(ids: string[], updates: IncidentUpdateRequest): Promise<AdminBulkUpdateResponse> {
    if (!ids.length) {
      throw new Error('No incident ids provided')
    }
    const payload = sanitizeUpdates(updates)
    if (!Object.keys(payload).length) {
      throw new Error('No updates provided')
    }
    if (!hasRemoteApi) {
      const data = await Promise.all(ids.map(id => incidentsApi.update(id, payload)))
      return { data, updated: data.length, errors: [] }
    }
    return apiClient.post<AdminBulkUpdateResponse>('/admin/incidents/bulk-status', {
      ids,
      ...payload,
    })
  },
}
