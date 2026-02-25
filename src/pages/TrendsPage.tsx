import React from 'react'
import { HazardTrendChart } from '@/components/charts/HazardTrendChart'
import { HazardTypeDonut } from '@/components/charts/HazardTypeDonut'
import { CityBarChart } from '@/components/charts/CityBarChart'
import { SourceActivityChart } from '@/components/charts/SourceActivityChart'
import { mockTrendData } from '@/data/mockTrendData'
import { AlertTriangle, TrendingUp } from 'lucide-react'

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Trends & Analytics</h1>
          <p className="text-sm text-muted-foreground">30-day hazard intelligence overview</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Last 30 days</span>
        </div>
      </div>

      {/* Predictions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-nazar-amber" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">High Risk Zones — Next 48H</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mockTrendData.predictions.map((p, i) => (
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
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Hazard Type Trends</h3>
        <HazardTrendChart />
      </div>

      {/* Two column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">By Hazard Type</h3>
          <HazardTypeDonut />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">By City</h3>
          <CityBarChart />
        </div>
      </div>

      {/* Source activity */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Source Activity</h3>
        <SourceActivityChart />
      </div>
    </div>
  )
}
