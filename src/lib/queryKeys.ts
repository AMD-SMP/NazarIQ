import type { IncidentApiFilters } from '@/types'

export const queryKeys = {
  incidents: {
    all: ['incidents'] as const,
    list: (filters?: IncidentApiFilters) => [...queryKeys.incidents.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.incidents.all, 'detail', id] as const,
  },
  trends: {
    all: ['trends'] as const,
    analytics: (dateRange: '7D' | '30D' | '90D' = '30D') => [...queryKeys.trends.all, 'analytics', dateRange] as const,
  },
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  admin: {
    alerts: () => ['admin', 'alerts'] as const,
    activity: (range: '7D' | '30D' | '90D' = '30D') => ['admin', 'activity', range] as const,
    incidents: () => ['admin', 'incidents'] as const,
  },
}
