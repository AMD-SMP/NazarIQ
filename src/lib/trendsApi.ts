import { apiClient } from '@/lib/apiClient'
import type { TrendAnalyticsResponse } from '@/types'

export const trendsApi = {
  analytics(range: '7D' | '30D' | '90D' = '30D') {
    return apiClient.get<TrendAnalyticsResponse>(`/trends?range=${range}`)
  },
}
