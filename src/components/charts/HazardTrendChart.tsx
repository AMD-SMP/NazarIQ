import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { HAZARD_COLORS, HAZARD_LABELS } from '@/lib/constants'
import { ChartFallback } from '@/components/shared/ChartFallback'
import type { HazardType, HazardTrendPoint } from '@/types'

type HazardTooltipEntry = {
  dataKey: string
  color: string
  value: number
}

interface HazardTooltipProps {
  active?: boolean
  payload?: HazardTooltipEntry[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: HazardTooltipProps) => {
  if (!active || !payload) return null
  return (
    <div className="glass-card rounded-lg p-3 text-xs">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">{HAZARD_LABELS[entry.dataKey as HazardType]}: {entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface HazardTrendChartProps {
  data: HazardTrendPoint[]
}

export const HazardTrendChart = React.memo(function HazardTrendChart({ data }: HazardTrendChartProps) {
  const hazardTypes = useMemo(() => Object.keys(HAZARD_COLORS) as HazardType[], [])
  const trimmedData = useMemo(() => trimSparseTrendData(data, hazardTypes), [data, hazardTypes])

  if (!trimmedData.length) {
    return <ChartFallback message="No trend data available" />
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <LineChart data={trimmedData}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          {hazardTypes.map(ht => (
            <Line key={ht} type="monotone" dataKey={ht} stroke={HAZARD_COLORS[ht]} strokeWidth={2} dot={false} name={HAZARD_LABELS[ht]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

function trimSparseTrendData(points: HazardTrendPoint[], keys: HazardType[]) {
  if (!points.length) return []
  const hasValueAt = (point: HazardTrendPoint) => keys.some(key => (point[key] ?? 0) > 0)
  let start = points.findIndex(hasValueAt)
  if (start === -1) return []
  let end = points.length - 1
  for (let idx = points.length - 1; idx >= 0; idx -= 1) {
    if (hasValueAt(points[idx])) {
      end = idx
      break
    }
  }
  if (start === 0 && end === points.length - 1) {
    return points
  }
  return points.slice(start, end + 1)
}
