import React, { useEffect, useMemo, useState } from 'react'
import { HazardTrendChart } from '@/components/charts/HazardTrendChart'
import { HazardTypeDonut } from '@/components/charts/HazardTypeDonut'
import { CityBarChart } from '@/components/charts/CityBarChart'
import { SourceActivityChart } from '@/components/charts/SourceActivityChart'
import { AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { trendsApi } from '@/lib/trendsApi'
import { queryKeys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import type { HazardType, TrendAnalyticsResponse } from '@/types'
import { HAZARD_COLORS, HAZARD_LABELS } from '@/lib/constants'
import { ChartFallback } from '@/components/shared/ChartFallback'

export default function TrendsPage() {
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D'>('90D')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.trends.analytics(dateRange),
    queryFn: () => trendsApi.analytics(dateRange),
    keepPreviousData: true,
  })

  useEffect(() => {
    if (isLoading || isError) return
    const noCityStats = (data?.cityStats?.length ?? 0) === 0
    if (noCityStats && dateRange !== '90D') {
      setDateRange('90D')
    }
  }, [isLoading, isError, data, dateRange])

  const hazardDistribution = useMemo(() => {
    if (!data?.daily?.length) return []
    const totals: Record<HazardType, number> = Object.fromEntries(
      (Object.keys(HAZARD_COLORS) as HazardType[]).map(key => [key, 0])
    ) as Record<HazardType, number>

    data.daily.forEach(point => {
      (Object.keys(HAZARD_COLORS) as HazardType[]).forEach(key => {
        totals[key] += Number(point[key] ?? 0)
      })
    })

    return (Object.keys(HAZARD_COLORS) as HazardType[])
      .map(key => ({
        name: HAZARD_LABELS[key],
        value: totals[key],
        color: HAZARD_COLORS[key],
      }))
      .filter(entry => entry.value > 0)
  }, [data])

  const predictions = data?.predictions ?? []

  const renderPredictionSkeleton = () => (
    Array.from({ length: 3 }).map((_, idx) => (
      <div key={`prediction-skeleton-${idx}`} className="rounded-lg border border-border bg-secondary/40 p-3 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted mb-2" />
        <div className="h-3 w-full rounded bg-muted" />
      </div>
    ))
  )

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Trends & Analytics</h1>
          <p className="text-sm text-muted-foreground">Hazard intelligence — last {dateRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-1 rounded-full border border-border p-1 text-[10px] font-semibold uppercase tracking-widest">
            {(['7D', '30D', '90D'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded-full px-2 py-0.5 transition-colors ${dateRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-destructive">Failed to load trends</p>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Predictions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-nazar-amber" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">High Risk Zones — Next 48H</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isLoading && !data ? renderPredictionSkeleton() : predictions.map(p => (
            <div key={p.city} className="rounded-lg border border-border bg-secondary p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">{p.city}</span>
                <span className="font-mono text-lg font-bold" style={{ color: p.risk > 80 ? '#EF4444' : p.risk > 60 ? '#F59E0B' : '#22C55E' }}>{p.risk}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.risk}%`, background: p.risk > 80 ? '#EF4444' : p.risk > 60 ? '#F59E0B' : '#22C55E' }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{p.reason}</p>
            </div>
          ))}
          {!isLoading && !predictions.length && (
            <div className="col-span-full">
              <ChartFallback message="No prediction data for this range" />
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Hazard Type Trends</h3>
        <HazardTrendChart data={data?.daily ?? []} />
      </div>

      {/* Two column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">By Hazard Type</h3>
          <HazardTypeDonut data={hazardDistribution} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">By City</h3>
          <CityBarChart data={data?.cityStats ?? []} />
        </div>
      </div>

      {/* Source activity */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Source Activity</h3>
        <SourceActivityChart data={data?.sourceDaily ?? []} />
      </div>
    </div>
  )
}
