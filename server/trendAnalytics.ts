import type {
  HazardType,
  Incident,
  Severity,
  SourceName,
  TrendAnalyticsResponse,
} from '../src/types'

const hazardTypes: HazardType[] = [
  'POTHOLE',
  'WATERLOGGING',
  'FALLEN_TREE',
  'ROAD_COLLAPSE',
  'CONSTRUCTION_ZONE',
  'STRUCTURAL_FAILURE',
  'DEBRIS',
  'SEWAGE_OVERFLOW',
  'OTHER',
]

const hazardLabels: Record<HazardType, string> = {
  POTHOLE: 'Pothole',
  WATERLOGGING: 'Waterlogging',
  FALLEN_TREE: 'Fallen Tree',
  ROAD_COLLAPSE: 'Road Collapse',
  CONSTRUCTION_ZONE: 'Construction Zone',
  STRUCTURAL_FAILURE: 'Structural Failure',
  DEBRIS: 'Debris',
  SEWAGE_OVERFLOW: 'Sewage Overflow',
  OTHER: 'Other',
}

const sourceNames: SourceName[] = [
  'reddit_india',
  'ndtv_news',
  'times_of_india',
  'twitter_local',
  'citizen_report',
  'municipal_feed',
  'bbmp_official',
]

const severityWeights: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const rangeDaysMap: Record<'7D' | '30D' | '90D', number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
}

type HazardCounts = Record<HazardType, number>
type SourceCounts = Record<SourceName, number>

function createHazardTemplate(): HazardCounts {
  return hazardTypes.reduce((acc, ht) => {
    acc[ht] = 0
    return acc
  }, {} as HazardCounts)
}

function createSourceTemplate(): SourceCounts {
  return sourceNames.reduce((acc, source) => {
    acc[source] = 0
    return acc
  }, {} as SourceCounts)
}

function normalizeDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return normalized.toISOString().split('T')[0]
}

function createDateSeries(range: '7D' | '30D' | '90D'): string[] {
  const days = rangeDaysMap[range] ?? 30
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, idx) => {
    const copy = new Date(today)
    copy.setUTCDate(today.getUTCDate() - (days - 1 - idx))
    return copy.toISOString().split('T')[0]
  })
}

function clampRisk(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(99, Math.round(value)))
}

export function buildTrendAnalytics(
  incidents: Incident[],
  range: '7D' | '30D' | '90D' = '30D',
): TrendAnalyticsResponse {
  const dateSeries = createDateSeries(range)
  const dateSet = new Set(dateSeries)

  const hazardDaily = new Map<string, HazardCounts>()
  const sourceDaily = new Map<string, SourceCounts>()

  dateSeries.forEach(date => {
    hazardDaily.set(date, createHazardTemplate())
    sourceDaily.set(date, createSourceTemplate())
  })

  const cityAgg = new Map<
    string,
    {
      city: string
      count: number
      critical: number
      score: number
      hazards: HazardCounts
    }
  >()

  incidents.forEach(incident => {
    const dateKey = normalizeDate(incident.createdAt)
    if (!dateSet.has(dateKey)) {
      return
    }

    const hazardForDay = hazardDaily.get(dateKey)
    if (hazardForDay) {
      hazardForDay[incident.type] = (hazardForDay[incident.type] ?? 0) + 1
    }

    const sourceForDay = sourceDaily.get(dateKey)
    if (sourceForDay) {
      sourceForDay[incident.source] = (sourceForDay[incident.source] ?? 0) + 1
    }

    const severityWeight = severityWeights[incident.severity] ?? 1
    const cityKey = incident.city || 'Unknown'
    if (!cityAgg.has(cityKey)) {
      cityAgg.set(cityKey, {
        city: cityKey,
        count: 0,
        critical: 0,
        score: 0,
        hazards: createHazardTemplate(),
      })
    }
    const cityEntry = cityAgg.get(cityKey)!
    cityEntry.count += 1
    if (incident.severity === 'CRITICAL') cityEntry.critical += 1
    cityEntry.score += severityWeight * 12 + (incident.riskScore ?? 50) * 0.4
    cityEntry.hazards[incident.type] = (cityEntry.hazards[incident.type] ?? 0) + 1
  })

  const cityStats = Array.from(cityAgg.values())
    .map(({ city, count, critical }) => ({ city, count, critical }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const maxCityScore = Math.max(
    ...Array.from(cityAgg.values()).map(entry => entry.score),
    1,
  )

  const predictions = Array.from(cityAgg.values())
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => {
      const dominantHazard = hazardTypes.reduce(
        (current, type) => {
          const value = entry.hazards[type]
          if (!current || value > current.value) {
            return { type, value }
          }
          return current
        },
        null as { type: HazardType; value: number } | null,
      )
      const reason = dominantHazard && dominantHazard.value > 0
        ? `${hazardLabels[dominantHazard.type]} reports rising (${dominantHazard.value} incidents)`
        : 'Incident load increasing versus baseline'
      const risk = clampRisk((entry.score / maxCityScore) * 100)
      return {
        city: entry.city,
        risk,
        reason,
      }
    })

  const daily = dateSeries.map(date => ({ date, ...(hazardDaily.get(date) ?? createHazardTemplate()) }))
  const sourceSeries = dateSeries.map(date => ({ date, ...(sourceDaily.get(date) ?? createSourceTemplate()) }))

  return {
    daily,
    sourceDaily: sourceSeries,
    cityStats,
    predictions,
  }
}
