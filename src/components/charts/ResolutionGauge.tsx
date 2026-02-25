import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface Props {
  resolved: number
  total: number
}

export const ResolutionGauge = React.memo(function ResolutionGauge({ resolved, total }: Props) {
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0
  const data = [{ value: pct, fill: 'hsl(var(--nazar-green))' }]

  return (
    <div className="relative h-[180px] w-full">
      <ResponsiveContainer>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
          <RadialBar background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="font-mono text-3xl font-bold text-foreground">{pct}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Resolved</span>
      </div>
    </div>
  )
})
