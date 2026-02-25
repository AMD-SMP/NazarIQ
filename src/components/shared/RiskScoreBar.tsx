import React, { useEffect, useState } from 'react'

interface Props {
  score: number
}

export const RiskScoreBar = React.memo(function RiskScoreBar({ score }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100)
    return () => clearTimeout(t)
  }, [score])

  const color = score > 60 ? '#EF4444' : score > 30 ? '#F59E0B' : '#22C55E'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
      <span className="font-mono text-xs font-semibold" style={{ color }}>{score}</span>
    </div>
  )
})
