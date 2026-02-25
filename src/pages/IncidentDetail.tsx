import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useFilters } from '@/context/FilterContext'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { HazardTypeBadge } from '@/components/shared/HazardTypeBadge'
import { SourceBadge } from '@/components/shared/SourceBadge'
import { RiskScoreBar } from '@/components/shared/RiskScoreBar'
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/constants'
import { ArrowLeft, MapPin, Clock, User, FileText } from 'lucide-react'

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const { incidents } = useFilters()
  const incident = incidents.find(i => i.id === id)

  if (!incident) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Incident not found</h2>
          <Link to="/" className="mt-2 text-sm text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const sevColor = SEVERITY_COLORS[incident.severity]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-6" style={{ background: `linear-gradient(135deg, ${sevColor}10, transparent)` }}>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{incident.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <HazardTypeBadge type={incident.type} />
              <span className="text-xs text-muted-foreground">{incident.city}</span>
            </div>
          </div>
          <div className="text-center">
            <svg viewBox="0 0 120 60" className="h-20 w-40">
              <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
              <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={sevColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(incident.riskScore / 100) * 157} 157`} />
              <text x="60" y="48" textAnchor="middle" fill={sevColor} fontSize="20" fontWeight="bold" fontFamily="var(--font-mono)">{incident.riskScore}</text>
              <text x="60" y="58" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="var(--font-mono)">RISK SCORE</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed">{incident.description}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">AI Summary</h3>
            <p className="text-sm text-primary italic">{incident.aiSummary}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Source Evidence</h3>
            <SourceBadge source={incident.source} />
            <div className="mt-2 rounded bg-secondary p-3">
              <p className="text-xs text-secondary-foreground italic">"{incident.rawExcerpt}"</p>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Confidence: <strong className="text-foreground">{incident.confidenceScore}%</strong></span>
              <span>Corroborating: <strong className="text-foreground">{incident.corroboratingReports}</strong></span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Location:</span><span className="text-foreground">{incident.location}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Created:</span><span className="font-mono text-foreground">{new Date(incident.createdAt).toLocaleString()}</span></div>
              <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Assigned:</span><span className="text-foreground">{incident.assignedTo}</span></div>
              <div className="flex items-center gap-2"><FileText className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Coords:</span><span className="font-mono text-foreground">{incident.coordinates.lat.toFixed(4)}, {incident.coordinates.lng.toFixed(4)}</span></div>
            </div>
          </div>
        </div>

        {/* Right column - Timeline */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Timeline</h3>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px]" style={{ background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--nazar-amber)), hsl(var(--nazar-green)))' }} />
              <div className="space-y-4">
                {incident.timeline.map((entry, i) => {
                  const color = STATUS_COLORS[entry.stage]
                  const isLast = i === incident.timeline.length - 1
                  return (
                    <div key={i} className="relative flex gap-3 pl-6">
                      <div className="absolute left-0 top-0.5">
                        <div className={`h-4 w-4 rounded-full border-2 ${isLast ? 'animate-blink' : ''}`}
                          style={{ borderColor: color, backgroundColor: `${color}33` }}>
                          <div className="h-full w-full rounded-full" style={{ backgroundColor: color, transform: 'scale(0.5)' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.stage} />
                          <span className="font-mono text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground">{entry.note}</p>
                        {entry.adminName && <p className="text-[10px] text-muted-foreground mt-0.5">— {entry.adminName}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {incident.adminNotes && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Admin Notes</h3>
              <p className="text-sm text-foreground">{incident.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
