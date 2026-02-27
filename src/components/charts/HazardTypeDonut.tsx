import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartFallback } from '@/components/shared/ChartFallback'

export interface HazardDonutDatum {
  name: string
  value: number
  color: string
}

interface HazardTypeDonutProps {
  data: HazardDonutDatum[]
}

export const HazardTypeDonut = React.memo(function HazardTypeDonut({ data }: HazardTypeDonutProps) {
  if (!data.length) {
    return <ChartFallback message="No hazard distribution data" />
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload
              return (
                <div className="glass-card rounded-lg px-3 py-2 text-xs">
                  <span style={{ color: d.color }}>{d.name}: {d.value}</span>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})
