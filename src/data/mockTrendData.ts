import type { HazardType } from '@/types'

const hazardTypes: HazardType[] = ['POTHOLE', 'WATERLOGGING', 'FALLEN_TREE', 'ROAD_COLLAPSE', 'CONSTRUCTION_ZONE', 'STRUCTURAL_FAILURE', 'DEBRIS', 'SEWAGE_OVERFLOW']

function generateDailyData(base: number, variance: number): number[] {
  return Array.from({ length: 30 }, () => Math.max(0, Math.round(base + (Math.random() - 0.5) * 2 * variance)))
}

export const mockTrendData = {
  daily: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2024, 0, i + 1)
    const entry: Record<string, string | number> = {
      date: date.toISOString().split('T')[0],
    }
    hazardTypes.forEach(ht => {
      const bases: Record<HazardType, number> = {
        POTHOLE: 8, WATERLOGGING: 5, FALLEN_TREE: 3, ROAD_COLLAPSE: 2,
        CONSTRUCTION_ZONE: 4, STRUCTURAL_FAILURE: 1, DEBRIS: 3, SEWAGE_OVERFLOW: 2,
      }
      entry[ht] = Math.max(0, Math.round(bases[ht] + (Math.random() - 0.5) * bases[ht]))
    })
    return entry
  }),

  sourceDaily: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    reddit_india: Math.round(5 + Math.random() * 8),
    ndtv_news: Math.round(3 + Math.random() * 5),
    times_of_india: Math.round(4 + Math.random() * 6),
    twitter_local: Math.round(8 + Math.random() * 12),
    citizen_report: Math.round(2 + Math.random() * 6),
    municipal_feed: Math.round(1 + Math.random() * 3),
    bbmp_official: Math.round(1 + Math.random() * 2),
  })),

  cityStats: [
    { city: 'Mumbai', count: 42, critical: 8 },
    { city: 'Bengaluru', count: 56, critical: 12 },
    { city: 'Delhi', count: 38, critical: 6 },
    { city: 'Hyderabad', count: 28, critical: 4 },
    { city: 'Chennai', count: 24, critical: 5 },
    { city: 'Pune', count: 18, critical: 2 },
    { city: 'Kolkata', count: 22, critical: 3 },
  ],

  predictions: [
    { city: 'Mumbai', risk: 87, reason: 'Heavy rainfall forecast + aging infrastructure' },
    { city: 'Bengaluru', risk: 74, reason: 'Construction activity surge + drainage gaps' },
    { city: 'Delhi', risk: 68, reason: 'Monsoon remnants + known flood points' },
  ],
}
