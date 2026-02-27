import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartFallback } from '@/components/shared/ChartFallback'
import type { CityStatPoint } from '@/types'

interface CityBarChartProps {
  data: CityStatPoint[]
}

export const CityBarChart = React.memo(function CityBarChart({ data }: CityBarChartProps) {
  const prepared = useMemo(() => {
    return [...data]
      .filter(point => Number(point.count) > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [data])

  if (!prepared.length) {
    return <ChartFallback message="No city stats available" />
  }

  const maxLabelLength = prepared.reduce((acc, point) => Math.max(acc, point.city.length), 0)
  const dynamicHeight = Math.max(200, prepared.length * 42)
  const yAxisWidth = Math.min(140, Math.max(80, maxLabelLength * 6))

  return (
    <div className="w-full" style={{ height: dynamicHeight }}>
      <ResponsiveContainer>
        <BarChart data={prepared} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={yAxisWidth} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload
              return (
                <div className="glass-card rounded-lg px-3 py-2 text-xs">
                  <p className="text-foreground font-semibold">{d.city}</p>
                  <p className="text-muted-foreground">Total: {d.count} | Critical: {d.critical}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
