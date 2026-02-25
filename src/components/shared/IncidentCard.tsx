import React from 'react'
import type { Incident } from '@/types'
import { HAZARD_COLORS, SEVERITY_COLORS } from '@/lib/constants'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'
import { RiskScoreBar } from './RiskScoreBar'
import { SourceBadge } from './SourceBadge'
import { MapPin, Link2 } from 'lucide-react'

interface Props {
  incident: Incident
  onClick?: () => void
  compact?: boolean
}

export const IncidentCard = React.memo(function IncidentCard({ incident, onClick, compact }: Props) {
  const hazardColor = HAZARD_COLORS[incident.type]
  const sevColor = SEVERITY_COLORS[incident.severity]

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:translate-x-1"
      style={{ borderLeftWidth: 4, borderLeftColor: hazardColor }}
      onClick={onClick}
    >
      {/* Severity strip */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${sevColor}, ${sevColor}66)` }} />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-mono text-[10px] text-muted-foreground">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">{incident.title}</h4>
          </div>
        </div>

        {!compact && (
          <>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{incident.city} — {incident.location}</span>
            </div>
            <div className="mt-2">
              <RiskScoreBar score={incident.riskScore} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <SourceBadge source={incident.source} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                <span>{incident.corroboratingReports} reports</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})
