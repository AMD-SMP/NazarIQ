import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { mockTrendData } from '@/data/mockTrendData'
import { HAZARD_COLORS, HAZARD_LABELS } from '@/lib/constants'
import type { HazardType } from '@/types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="glass-card rounded-lg p-3 text-xs">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">{HAZARD_LABELS[entry.dataKey as HazardType]}: {entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const HazardTrendChart = React.memo(function HazardTrendChart() {
  const hazardTypes = Object.keys(HAZARD_COLORS) as HazardType[]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <LineChart data={mockTrendData.daily}>
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
