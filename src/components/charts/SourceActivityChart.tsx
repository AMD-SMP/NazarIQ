import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { mockTrendData } from '@/data/mockTrendData'
import { SOURCE_COLORS, SOURCE_LABELS } from '@/lib/constants'
import type { SourceName } from '@/types'

export const SourceActivityChart = React.memo(function SourceActivityChart() {
  const sources = Object.keys(SOURCE_COLORS) as SourceName[]

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer>
        <AreaChart data={mockTrendData.sourceDaily}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null
              return (
                <div className="glass-card rounded-lg p-3 text-xs">
                  <p className="font-mono text-muted-foreground mb-1">{label}</p>
                  {payload.map((e: any) => (
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
