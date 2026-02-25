import React, { useState, useMemo, useCallback } from 'react'
import type { Incident } from '@/types'
import { SEVERITY_COLORS, HAZARD_COLORS, CITY_COORDS } from '@/lib/constants'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useNavigate } from 'react-router-dom'

interface Props {
  incidents: Incident[]
}

// Map coordinates to SVG positions (approximate India map projection)
function toSVG(lat: number, lng: number): { x: number; y: number } {
  // India bounding box: lat 8-35, lng 68-97
  const x = ((lng - 68) / (97 - 68)) * 100
  const y = ((35 - lat) / (35 - 8)) * 100
  return { x, y }
}

export const MapSimulation = React.memo(function MapSimulation({ incidents }: Props) {
  const [selected, setSelected] = useState<Incident | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const navigate = useNavigate()

  // Cluster incidents by city
  const cityGroups = useMemo(() => {
    const groups: Record<string, Incident[]> = {}
    incidents.forEach(inc => {
      if (!groups[inc.city]) groups[inc.city] = []
      groups[inc.city].push(inc)
    })
    return groups
  }, [incidents])

  const handleZoom = useCallback((dir: number) => {
    setScale(s => Math.max(0.8, Math.min(3, s + dir * 0.3)))
  }, [])

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-lg border border-border bg-card">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={() => handleZoom(1)} className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-foreground text-sm font-bold hover:bg-accent transition-colors">+</button>
        <button onClick={() => handleZoom(-1)} className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-foreground text-sm font-bold hover:bg-accent transition-colors">−</button>
      </div>
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${showHeatmap ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
        >
          Heatmap
        </button>
      </div>

      {/* Map area */}
      <div
        className="h-full w-full"
        style={{ transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full" style={{ minHeight: 400 }}>
          {/* India outline (simplified) */}
          <path
            d="M 35 10 Q 40 5, 50 8 L 65 10 Q 72 12, 75 20 L 78 30 Q 80 40, 75 50 L 70 60 Q 65 70, 55 75 L 50 85 Q 45 90, 40 85 L 35 75 Q 25 65, 22 55 L 20 45 Q 18 35, 22 25 L 28 15 Z"
            fill="hsl(var(--secondary))"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.6"
          />

          {/* Grid dots */}
          {Array.from({ length: 10 }, (_, r) =>
            Array.from({ length: 10 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={10 + c * 9} cy={10 + r * 9} r="0.3" fill="hsl(var(--border))" opacity="0.3" />
            ))
          )}

          {/* Heatmap overlays */}
          {showHeatmap && Object.entries(cityGroups).map(([city, incs]) => {
            const coords = CITY_COORDS[city]
            if (!coords) return null
            const pos = toSVG(coords.lat, coords.lng)
            const intensity = Math.min(incs.length / 10, 1)
            const critCount = incs.filter(i => i.severity === 'CRITICAL').length
            const color = critCount > 2 ? '#EF4444' : critCount > 0 ? '#F59E0B' : '#22C55E'
            return (
              <circle key={`heat-${city}`} cx={pos.x} cy={pos.y} r={8 + incs.length * 2} fill={color} opacity={0.15 + intensity * 0.15} />
            )
          })}

          {/* City markers */}
          {Object.entries(cityGroups).map(([city, incs]) => {
            const coords = CITY_COORDS[city]
            if (!coords) return null
            const pos = toSVG(coords.lat, coords.lng)
            const worstSeverity = incs.reduce((w, i) => {
              const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
              return order[i.severity] < order[w] ? i.severity : w
            }, 'LOW' as keyof typeof SEVERITY_COLORS)
            const color = SEVERITY_COLORS[worstSeverity]

            return (
              <g key={city} className="cursor-pointer" onClick={() => setSelected(incs[0])}>
                {/* Ping animation for critical */}
                {worstSeverity === 'CRITICAL' && (
                  <circle cx={pos.x} cy={pos.y} r="2" fill={color} opacity="0.4" className="animate-marker-ping" />
                )}
                {/* Marker */}
                <rect x={pos.x - 1.5} y={pos.y - 1.5} width="3" height="3" rx="0.5" fill={color} stroke="hsl(var(--background))" strokeWidth="0.3" />
                {/* Count badge */}
                {incs.length > 1 && (
                  <>
                    <circle cx={pos.x + 2} cy={pos.y - 2} r="2" fill="hsl(var(--primary))" />
                    <text x={pos.x + 2} y={pos.y - 1.3} textAnchor="middle" fontSize="2" fill="hsl(var(--primary-foreground))" fontWeight="bold">{incs.length}</text>
                  </>
                )}
                {/* City label */}
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="2.2" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">{city}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-20 glass-card rounded-lg p-3 animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={selected.severity} />
                <StatusBadge status={selected.status} />
              </div>
              <h4 className="text-sm font-semibold text-foreground">{selected.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.city} — {selected.location}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/incident/${selected.id}`) }}
                className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                VIEW
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(null) }}
                className="rounded bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1" style={{ display: selected ? 'none' : 'flex' }}>
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
          <div key={sev} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
            {sev}
          </div>
        ))}
      </div>
    </div>
  )
})
