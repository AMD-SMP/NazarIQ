import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockTrendData } from '@/data/mockTrendData'

export const CityBarChart = React.memo(function CityBarChart() {
  const sorted = [...mockTrendData.cityStats].sort((a, b) => b.count - a.count)

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer>
        <BarChart data={sorted} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={80} />
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
