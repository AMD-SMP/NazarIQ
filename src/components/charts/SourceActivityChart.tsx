import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SOURCE_COLORS, SOURCE_LABELS } from '@/lib/constants'
import { ChartFallback } from '@/components/shared/ChartFallback'
import type { SourceName, SourceActivityPoint } from '@/types'

type SourceTooltipEntry = {
  dataKey: string
  color: string
  value: number
}

interface SourceTooltipProps {
  active?: boolean
  payload?: SourceTooltipEntry[]
  label?: string
}

interface SourceActivityChartProps {
  data: SourceActivityPoint[]
}

export const SourceActivityChart = React.memo(function SourceActivityChart({ data }: SourceActivityChartProps) {
  const sources = Object.keys(SOURCE_COLORS) as SourceName[]

  if (!data.length) {
    return <ChartFallback message="No source activity data" />
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            content={({ active, payload, label }: SourceTooltipProps) => {
              if (!active || !payload) return null
              return (
                <div className="glass-card rounded-lg p-3 text-xs">
                  <p className="font-mono text-muted-foreground mb-1">{label}</p>
                  {payload.map((e) => (
                    <div key={e.dataKey} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-foreground">{SOURCE_LABELS[e.dataKey as SourceName]}: {e.value}</span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          {sources.map(s => (
            <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={SOURCE_COLORS[s]} fill={SOURCE_COLORS[s]} fillOpacity={0.3} name={SOURCE_LABELS[s]} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
