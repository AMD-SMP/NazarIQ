import { apiClient } from '@/lib/apiClient'
import { mockIncidents } from '@/data/mockIncidents'
import type {
  ApiListResponse,
  Incident,
  IncidentApiFilters,
  IncidentUpdateRequest,
} from '@/types'

const hasRemoteApi = Boolean(import.meta.env.VITE_API_BASE_URL)
let mockStore = [...mockIncidents]

function applyLocalFilters(data: Incident[], filters?: IncidentApiFilters) {
  if (!filters) return data
  return data.filter(inc => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!inc.title.toLowerCase().includes(q) && !inc.id.toLowerCase().includes(q)) return false
    }
    if (filters.cities?.length && !filters.cities.includes(inc.city)) return false
    if (filters.severities?.length && !filters.severities.includes(inc.severity)) return false
    if (filters.statuses?.length && !filters.statuses.includes(inc.status)) return false
    if (filters.hazardTypes?.length && !filters.hazardTypes.includes(inc.type)) return false
    return true
  })
}

function serializeFilters(filters?: IncidentApiFilters) {
  const params = new URLSearchParams()
  if (!filters) return params
  if (filters.search) params.set('search', filters.search)
  ;(filters.cities ?? []).forEach(value => params.append('cities', value))
  ;(filters.severities ?? []).forEach(value => params.append('severities', value))
  ;(filters.statuses ?? []).forEach(value => params.append('statuses', value))
  ;(filters.hazardTypes ?? []).forEach(value => params.append('hazardTypes', value))
  if (filters.dateRange) params.set('dateRange', filters.dateRange)
  return params
}

export const incidentsApi = {
  async list(filters?: IncidentApiFilters): Promise<ApiListResponse<Incident>> {
    if (!hasRemoteApi) {
      return { data: applyLocalFilters(mockStore, filters) }
    }
    const params = serializeFilters(filters)
    const query = params.toString()
    const path = query ? `/incidents?${query}` : '/incidents'
    return apiClient.get<ApiListResponse<Incident>>(path)
  },

  async detail(id: string): Promise<Incident> {
    if (!hasRemoteApi) {
      const found = mockStore.find(inc => inc.id === id)
      if (!found) throw new Error('Incident not found')
      return found
    }
    return apiClient.get<Incident>(`/incidents/${id}`)
  },

  async update(id: string, updates: IncidentUpdateRequest): Promise<Incident> {
    if (!hasRemoteApi) {
      mockStore = mockStore.map(inc => (inc.id === id ? { ...inc, ...updates, updatedAt: new Date().toISOString() } : inc))
      const updated = mockStore.find(inc => inc.id === id)
      if (!updated) throw new Error('Incident not found')
      return updated
    }
    return apiClient.patch<Incident>(`/incidents/${id}`, updates)
  },
}
