import React, { useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useFilters } from '@/context/FilterContext'
import { StatCard } from '@/components/shared/StatCard'
import { IncidentCard } from '@/components/shared/IncidentCard'
import { MapSimulation } from '@/components/map/MapSimulation'
import { ResolutionGauge } from '@/components/charts/ResolutionGauge'
import { mockActivityLog } from '@/data/mockActivityLog'
import { mockAlerts } from '@/data/mockAlerts'
import { Activity, AlertTriangle, Clock, CheckCircle, XCircle, Shield, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { STATUS_COLORS } from '@/lib/constants'

const ACTION_COLORS: Record<string, string> = {
  STATUS_CHANGE: '#2B7FFF',
  NOTE_ADDED: '#06B6D4',
  ALERT_SENT: '#F59E0B',
  ESCALATED: '#EF4444',
  RESOLVED: '#22C55E',
}

export default function AdminDashboard() {
  const { userName } = useAuth()
  const { incidents, filteredIncidents } = useFilters()
  const navigate = useNavigate()
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

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
          <span className="font-mono text-sm text-foreground">{clock.toLocaleTimeString()}</span>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <span className="text-xs font-semibold text-primary">ADMIN: {userName}</span>
          </div>
          <div className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-critical-pulse">{mockAlerts.filter(a => a.status === 'SENT').length}</span>
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
                    <p className="font-mono text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
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
