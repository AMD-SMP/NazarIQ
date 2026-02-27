import React, { useMemo, useState } from 'react'
import { Eye, Activity, AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useFilters } from '@/context/FilterContext'
import { StatCard } from '@/components/shared/StatCard'
import { IncidentCard } from '@/components/shared/IncidentCard'
import { MapSimulation } from '@/components/map/MapSimulation'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNavigate } from 'react-router-dom'
import { CITIES, HAZARD_LABELS } from '@/lib/constants'
import type { HazardType, Incident, Severity } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function PublicDashboard() {
  const { filteredIncidents, incidents, filters, setFilter, resetFilters, incidentsLoading, incidentsError, refetchIncidents } = useFilters()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<'newest' | 'critical' | 'risk'>('newest')

  const stats = useMemo(() => {
    const active = incidents.filter(i => i.status !== 'RESOLVED')
    const critical = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED')
    const resolved = incidents.filter(i => i.status === 'RESOLVED')
    return { active: active.length, critical: critical.length, resolved: resolved.length }
  }, [incidents])

  const sparklineMetrics = useMemo(() => buildSparklineMetrics(incidents, 7), [incidents])
  const { activeSeries, criticalSeries, resolvedSeries, resolutionSeries, avgResolutionHours } = sparklineMetrics

  const activeTrend = useMemo(() => derivePercentTrend(activeSeries), [activeSeries])
  const criticalTrend = useMemo(() => derivePercentTrend(criticalSeries), [criticalSeries])
  const resolvedTrend = useMemo(() => derivePercentTrend(resolvedSeries), [resolvedSeries])
  const resolutionTrend = useMemo(() => deriveResolutionTrend(resolutionSeries), [resolutionSeries])

  const sorted = useMemo(() => {
    const list = [...filteredIncidents]
    if (sortBy === 'critical') list.sort((a, b) => {
      const o = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return o[a.severity] - o[b.severity]
    })
    else if (sortBy === 'risk') list.sort((a, b) => b.riskScore - a.riskScore)
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [filteredIncidents, sortBy])

  const activeFilters = filters.cities.length + filters.severities.length + filters.hazardTypes.length + filters.statuses.length

  const SkeletonCard = () => (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted mb-3" />
      <div className="h-6 w-16 rounded bg-muted" />
    </div>
  )

  const FeedSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-border bg-card p-4 animate-pulse">
          <div className="h-4 w-32 rounded bg-muted mb-2" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.3 }} />
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-[1px] w-40 bg-nazar-cyan/60 animate-scan-line" style={{ top: '50%', position: 'absolute' }} />
        </div>
        <div className="relative flex items-center justify-between px-6 py-8">
          <div>
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-primary" />
              <h1 className="font-heading text-3xl font-extrabold text-foreground">
                Nazar<sup className="text-primary">IQ</sup>
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Watchful Intelligence for Every City</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-nazar-green animate-blink" />
              <span className="font-mono text-xs text-nazar-green">LIVE</span>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Incidents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {incidentsLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
        ) : (
          <>
            <StatCard
              title="Active Incidents"
              value={stats.active}
              icon={<Activity className="h-5 w-5" />}
              color="#2B7FFF"
              sparklineData={activeSeries}
              trend={activeTrend.trend}
              trendValue={activeTrend.trendValue}
            />
            <StatCard
              title="Critical Alerts"
              value={stats.critical}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="#EF4444"
              sparklineData={criticalSeries}
              trend={criticalTrend.trend}
              trendValue={criticalTrend.trendValue}
            />
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={<CheckCircle className="h-5 w-5" />}
              color="#22C55E"
              sparklineData={resolvedSeries}
              trend={resolvedTrend.trend}
              trendValue={resolvedTrend.trendValue}
            />
            <StatCard
              title="Avg Resolution"
              value={Math.round(avgResolutionHours)}
              subtitle="hours"
              icon={<Clock className="h-5 w-5" />}
              color="#06B6D4"
              sparklineData={resolutionSeries}
              trend={resolutionTrend.trend}
              trendValue={resolutionTrend.trendValue}
            />
          </>
        )}
      </div>

      {incidentsError && (
        <div className="mx-4 mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div className="flex-1 text-sm text-destructive">
              <p className="font-semibold">Failed to load latest incidents</p>
              <p className="text-xs opacity-80">{incidentsError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetchIncidents()}>Retry</Button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 pt-0">
        {/* Filter sidebar */}
        <div className="w-full lg:w-60 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filters {activeFilters > 0 && <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{activeFilters}</span>}
            </h3>
            {activeFilters > 0 && <button onClick={resetFilters} className="text-[10px] text-primary hover:underline">Clear all</button>}
          </div>

          <Input placeholder="Search incidents..." value={filters.search} onChange={e => setFilter('search', e.target.value)} className="h-8 text-xs" />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">City</p>
            <div className="flex flex-wrap gap-1">
              {CITIES.map(c => (
                <button key={c} onClick={() => setFilter('cities', filters.cities.includes(c) ? filters.cities.filter(x => x !== c) : [...filters.cities, c])}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${filters.cities.includes(c) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Severity</p>
            <div className="flex flex-wrap gap-1">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => (
                <button key={s} onClick={() => setFilter('severities', filters.severities.includes(s) ? filters.severities.filter(x => x !== s) : [...filters.severities, s])}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${filters.severities.includes(s) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hazard Type</p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(HAZARD_LABELS) as HazardType[]).map(h => (
                <button key={h} onClick={() => setFilter('hazardTypes', filters.hazardTypes.includes(h) ? filters.hazardTypes.filter(x => x !== h) : [...filters.hazardTypes, h])}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${filters.hazardTypes.includes(h) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}>
                  {HAZARD_LABELS[h]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px]">
          {incidentsLoading ? (
            <div className="h-full w-full rounded-lg border border-border bg-muted/40 animate-pulse" />
          ) : (
            <MapSimulation
              incidents={filteredIncidents}
              focusCity={filters.cities.length === 1 ? filters.cities[0] : undefined}
            />
          )}
        </div>

        {/* Incident feed */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Feed</h3>
              <span className="h-1.5 w-1.5 rounded-full bg-nazar-green animate-blink" />
              <span className="font-mono text-[10px] text-muted-foreground">{sorted.length}</span>
            </div>
          </div>
          <div className="flex gap-1 mb-3">
            {(['newest', 'critical', 'risk'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${sortBy === s ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incidentsLoading ? (
              <FeedSkeleton />
            ) : sorted.length === 0 ? (
              <EmptyState />
            ) : (
              sorted.slice(0, 12).map(inc => (
                <IncidentCard key={inc.id} incident={inc} onClick={() => navigate(`/incident/${inc.id}`)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type TrendMeta = {
  trend?: 'up' | 'down'
  trendValue?: string
}

type SparklineMetrics = {
  activeSeries: number[]
  criticalSeries: number[]
  resolvedSeries: number[]
  resolutionSeries: number[]
  avgResolutionHours: number
}

function buildSparklineMetrics(incidents: Incident[], days: number): SparklineMetrics {
  const dateKeys = buildDateKeys(days)
  const template = dateKeys.reduce<Record<string, { active: number; critical: number; resolved: number; durationTotal: number; durationCount: number }>>((acc, key) => {
    acc[key] = { active: 0, critical: 0, resolved: 0, durationTotal: 0, durationCount: 0 }
    return acc
  }, {})

  let totalResolutionHours = 0
  let resolutionSamples = 0

  incidents.forEach(incident => {
    const createdKey = normalizeDateKey(incident.createdAt)
    if (createdKey && template[createdKey]) {
      if (incident.status !== 'RESOLVED') {
        template[createdKey].active += 1
      }
      if (incident.severity === 'CRITICAL' && incident.status !== 'RESOLVED') {
        template[createdKey].critical += 1
      }
    }

    const resolvedKey = incident.resolvedAt ? normalizeDateKey(incident.resolvedAt) : null
    if (incident.status === 'RESOLVED' && resolvedKey && template[resolvedKey]) {
      template[resolvedKey].resolved += 1
    }

    if (incident.resolvedAt) {
      const createdTime = Date.parse(incident.createdAt)
      const resolvedTime = Date.parse(incident.resolvedAt)
      const durationHours = (resolvedTime - createdTime) / 36e5
      if (Number.isFinite(durationHours) && durationHours >= 0) {
        totalResolutionHours += durationHours
        resolutionSamples += 1
        if (resolvedKey && template[resolvedKey]) {
          template[resolvedKey].durationTotal += durationHours
          template[resolvedKey].durationCount += 1
        }
      }
    }
  })

  return {
    activeSeries: dateKeys.map(key => template[key].active),
    criticalSeries: dateKeys.map(key => template[key].critical),
    resolvedSeries: dateKeys.map(key => template[key].resolved),
    resolutionSeries: dateKeys.map(key => template[key].durationCount ? template[key].durationTotal / template[key].durationCount : 0),
    avgResolutionHours: resolutionSamples ? totalResolutionHours / resolutionSamples : 0,
  }
}

function buildDateKeys(days: number) {
  const today = new Date()
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const keys: string[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(base)
    date.setUTCDate(base.getUTCDate() - offset)
    keys.push(date.toISOString().split('T')[0])
  }
  return keys
}

function normalizeDateKey(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return normalized.toISOString().split('T')[0]
}

function derivePercentTrend(series: number[]): TrendMeta {
  if (!series?.length || series.length < 2) return {}
  const first = series[0]
  const last = series[series.length - 1]
  if (first === last) return {}
  const base = first === 0 ? Math.max(last, 1) : first
  const change = ((last - first) / base) * 100
  if (!Number.isFinite(change) || change === 0) return {}
  return {
    trend: last > first ? 'up' : 'down',
    trendValue: `${Math.abs(change).toFixed(0)}%`,
  }
}

function deriveResolutionTrend(series: number[]): TrendMeta {
  if (!series?.length || series.length < 2) return {}
  const first = series[0]
  const last = series[series.length - 1]
  const diff = last - first
  if (Math.abs(diff) < 0.1) return {}
  return {
    trend: diff > 0 ? 'up' : 'down',
    trendValue: `${Math.abs(diff).toFixed(1)}h`,
  }
}
