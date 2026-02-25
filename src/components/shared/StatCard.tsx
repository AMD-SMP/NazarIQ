import React, { type ReactNode } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  title: string
  value: number
  subtitle?: string
  trend?: 'up' | 'down'
  trendValue?: string
  color: string
  icon: ReactNode
  sparklineData?: number[]
}

export const StatCard = React.memo(function StatCard({ title, value, subtitle, trend, trendValue, color, icon, sparklineData }: Props) {
  const displayValue = useCountUp(value)

  const sparkData = sparklineData?.map((v, i) => ({ v, i }))

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        boxShadow: `0 0 0 0 ${color}00`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${color}25` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${color}00` }}
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="mt-1 font-mono text-3xl font-bold text-foreground animate-count-up">{displayValue}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && trendValue && (
            <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-nazar-red' : 'text-nazar-green'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
        </div>
        <div className="text-muted-foreground opacity-50" style={{ color }}>{icon}</div>
      </div>
      {sparkData && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
})
