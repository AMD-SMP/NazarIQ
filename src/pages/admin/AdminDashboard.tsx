import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useFilters } from '@/context/FilterContext'
import { StatCard } from '@/components/shared/StatCard'
import { IncidentCard } from '@/components/shared/IncidentCard'
import { MapSimulation } from '@/components/map/MapSimulation'
import { ResolutionGauge } from '@/components/charts/ResolutionGauge'
import { mockActivityLog } from '@/data/mockActivityLog'
import { mockAlerts } from '@/data/mockAlerts'
import { Activity, AlertTriangle, Clock, CheckCircle, XCircle, Shield, Bell, X, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { STATUS_COLORS, SEVERITY_COLORS } from '@/lib/constants'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { useToast } from '@/hooks/use-toast'

const ACTION_COLORS: Record<string, string> = {
  STATUS_CHANGE: '#2B7FFF',
  NOTE_ADDED: '#06B6D4',
  ALERT_SENT: '#F59E0B',
  ESCALATED: '#EF4444',
  RESOLVED: '#22C55E',
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function AdminDashboard() {
  const { userName } = useAuth()
  const { incidents, filteredIncidents } = useFilters()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [clock, setClock] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const alerts = useMemo(() => mockAlerts.filter(a => !dismissedIds.has(a.id)), [dismissedIds])
  const unreadCount = useMemo(() => alerts.filter(a => a.status === 'SENT' || a.status === 'DELIVERED').length, [alerts])

  const dismissAlert = useCallback((id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
    toast({ title: '✓ Notification dismissed' })
  }, [toast])

  const stats = useMemo(() => {
    const active = incidents.filter(i => i.status !== 'RESOLVED')
    const critical = active.filter(i => i.severity === 'CRITICAL')
    const inProgress = active.filter(i => i.status === 'IN_PROGRESS')
    const resolved = incidents.filter(i => i.status === 'RESOLVED')
    const falseReports = 3
    return { active: active.length, critical: critical.length, inProgress: inProgress.length, resolved: resolved.length, falseReports }
  }, [incidents])

  const priorityQueue = useMemo(() => {
    return incidents
      .filter(i => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.status !== 'RESOLVED')
      .sort((a, b) => b.riskScore - a.riskScore)
  }, [incidents])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-lg font-bold text-foreground">Operations Center</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono text-sm text-foreground">{clock.toLocaleTimeString()}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{clock.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <span className="text-xs font-semibold text-primary">ADMIN: {userName}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-critical-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[520px] overflow-hidden rounded-lg border border-border bg-card shadow-xl animate-slide-up">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{alerts.length}</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="rounded p-1 hover:bg-accent transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[440px] divide-y divide-border">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className="px-4 py-3 hover:bg-accent/50 transition-colors group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={alert.priority} />
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                alert.status === 'SENT' ? 'bg-nazar-amber/10 text-nazar-amber' :
                                alert.status === 'DELIVERED' ? 'bg-nazar-blue/10 text-nazar-blue' :
                                alert.status === 'ACKNOWLEDGED' ? 'bg-nazar-green/10 text-nazar-green' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {alert.status}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground truncate">{alert.subject}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="font-mono text-[10px] text-muted-foreground">{formatTimestamp(alert.sentAt)}</span>
                              <span className="text-[10px] text-muted-foreground">by {alert.sentBy}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground">Cities:</span>
                              {alert.targetCities.map(c => (
                                <span key={c} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">{c}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => navigate(`/incident/${alert.incidentId}`)}
                              className="rounded p-1 hover:bg-primary/10 transition-colors"
                              title="View incident"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            </button>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="rounded p-1 hover:bg-destructive/10 transition-colors"
                              title="Dismiss"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4">
        <StatCard title="Active" value={stats.active} icon={<Activity className="h-5 w-5" />} color="#2B7FFF" />
        <StatCard title="Critical" value={stats.critical} icon={<AlertTriangle className="h-5 w-5" />} color="#EF4444" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Clock className="h-5 w-5" />} color="#A855F7" />
        <StatCard title="Resolved Today" value={stats.resolved} icon={<CheckCircle className="h-5 w-5" />} color="#22C55E" />
        <StatCard title="False Reports" value={stats.falseReports} icon={<XCircle className="h-5 w-5" />} color="#778CA3" />
      </div>

      {/* War room */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 pt-0">
        {/* Priority queue */}
        <div className="w-full lg:w-80 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Priority Queue</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {priorityQueue.map(inc => (
              <IncidentCard key={inc.id} incident={inc} onClick={() => navigate(`/incident/${inc.id}`)} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px]">
          <MapSimulation incidents={filteredIncidents} />
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Resolution Rate</h3>
            <ResolutionGauge resolved={stats.resolved} total={incidents.length} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Recent Activity</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {mockActivityLog.slice(0, 8).map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs" style={{ borderLeft: `2px solid ${ACTION_COLORS[log.action] || '#666'}`, paddingLeft: 8 }}>
                  <div>
                    <p className="text-foreground font-medium">{log.adminName}</p>
                    <p className="text-muted-foreground">{log.action.replace('_', ' ')} on {log.incidentId}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{formatTimestamp(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
