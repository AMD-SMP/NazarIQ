import React, { useMemo, useState, useCallback } from 'react'
import { useFilters } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { HazardTypeBadge } from '@/components/shared/HazardTypeBadge'
import { SourceBadge } from '@/components/shared/SourceBadge'
import { RiskScoreBar } from '@/components/shared/RiskScoreBar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { ChevronDown, ChevronUp, Eye, Search } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/adminApi'
import { queryKeys } from '@/lib/queryKeys'
import type { AdminBulkUpdateResponse, Incident, Status } from '@/types'

type SortKey = 'id' | 'city' | 'severity' | 'status' | 'riskScore' | 'createdAt'
type SortDir = 'asc' | 'desc'

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function IncidentManagement() {
  const { filteredIncidents } = useFilters()
  const { role } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const invalidateIncidentQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all }).catch(() => {})
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.incidents() }).catch(() => {})
  }, [queryClient])

  const singleUpdateMutation = useMutation<Incident, Error, { id: string; status: Status }>({
    mutationFn: ({ id, status }) => adminApi.updateIncident(id, { status }),
    onSuccess: invalidateIncidentQueries,
  })

  const bulkUpdateMutation = useMutation<AdminBulkUpdateResponse, Error, { ids: string[]; status: Status }>({
    mutationFn: ({ ids, status }) => adminApi.bulkUpdateIncidents(ids, { status }),
    onSuccess: invalidateIncidentQueries,
  })

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }, [sortKey])

  const data = useMemo(() => {
    let list = filteredIncidents
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.city.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'severity') cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
      else if (sortKey === 'riskScore') cmp = a.riskScore - b.riskScore
      else if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]))
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [filteredIncidents, search, sortKey, sortDir])

  const handleStatusChange = useCallback(async (id: string, status: Status) => {
    try {
      await singleUpdateMutation.mutateAsync({ id, status })
      toast({ title: '✓ Incident updated successfully', description: `${id} → ${status}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update incident'
      toast({ title: 'Update failed', description: message, variant: 'destructive' })
    }
  }, [singleUpdateMutation, toast])

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })

  const handleBulkUpdate = useCallback(async (status: Status) => {
    const ids = Array.from(selected)
    if (!ids.length) return
    try {
      const result = await bulkUpdateMutation.mutateAsync({ ids, status })
      const failed = result.errors.length
      if (failed) {
        const failedList = result.errors
          .slice(0, 3)
          .map(error => error.id)
          .join(', ')
        toast({
          title: 'Bulk update partially applied',
          description: `${result.updated}/${ids.length} succeeded. Failed: ${failedList}${failed > 3 ? '…' : ''}`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Bulk update complete', description: `${result.updated} incidents → ${status}` })
      }
      setSelected(new Set())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk update failed'
      toast({ title: 'Bulk update error', description: message, variant: 'destructive' })
    }
  }, [selected, bulkUpdateMutation, toast])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const TH = ({ col, label, className = '' }: { col: SortKey; label: string; className?: string }) => (
    <th onClick={() => handleSort(col)} className={`cursor-pointer select-none px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground ${className}`}>
      <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
    </th>
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold text-foreground">Incident Management</h1>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{data.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by ID, title, city..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-9 text-xs" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" className="rounded border-border" onChange={e => setSelected(e.target.checked ? new Set(data.map(d => d.id)) : new Set())} checked={selected.size === data.length && data.length > 0} />
                </th>
                <TH col="id" label="ID" />
                <TH col="city" label="City" />
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Type</th>
                <TH col="severity" label="Severity" />
                <TH col="status" label="Status" />
                <TH col="riskScore" label="Risk" />
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Source</th>
                <TH col="createdAt" label="Created" />
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((inc, i) => (
                <React.Fragment key={inc.id}>
                  <tr className={`border-b border-border transition-colors hover:bg-accent/50 ${selected.has(inc.id) ? 'bg-primary/5' : i % 2 === 0 ? '' : 'bg-secondary/30'}`}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(inc.id)} onChange={() => toggleSelect(inc.id)} className="rounded border-border" /></td>
                    <td className="px-3 py-2 font-mono text-foreground">{inc.id}</td>
                    <td className="px-3 py-2 text-foreground">{inc.city}</td>
                    <td className="px-3 py-2"><HazardTypeBadge type={inc.type} /></td>
                    <td className="px-3 py-2"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-3 py-2"><StatusBadge status={inc.status} /></td>
                    <td className="px-3 py-2 w-32"><RiskScoreBar score={inc.riskScore} /></td>
                    <td className="px-3 py-2"><SourceBadge source={inc.source} /></td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(inc.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/incident/${inc.id}`)} className="rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors">
                          <Eye className="h-3 w-3" />
                        </button>
                        {role === 'admin' && inc.status !== 'RESOLVED' && (
                          <select
                            value={inc.status}
                            onChange={e => handleStatusChange(inc.id, e.target.value as Status)}
                            className="rounded bg-secondary px-1 py-0.5 text-[10px] text-foreground border border-border"
                            disabled={singleUpdateMutation.isPending || bulkUpdateMutation.isPending}
                          >
                            <option value="DETECTED">DETECTED</option>
                            <option value="ALERTED">ALERTED</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                        )}
                        <button onClick={() => setExpanded(expanded === inc.id ? null : inc.id)} className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground">
                          {expanded === inc.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === inc.id && (
                    <tr className="bg-secondary/20">
                      <td colSpan={10} className="px-6 py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-primary italic">{inc.aiSummary}</p>
                          {inc.adminNotes && <p className="text-xs text-muted-foreground">Notes: {inc.adminNotes}</p>}
                          <p className="text-[10px] text-muted-foreground">Confidence: {inc.confidenceScore}% | Reports: {inc.corroboratingReports} | Assigned: {inc.assignedTo}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-6 py-3 flex items-center justify-between animate-slide-up">
          <span className="text-sm font-semibold text-foreground">{selected.size} incidents selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkUpdateMutation.isPending}
              onClick={() => { void handleBulkUpdate('IN_PROGRESS') }}
            >
              Mark In Progress
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-nazar-green border-nazar-green/30"
              disabled={bulkUpdateMutation.isPending}
              onClick={() => { void handleBulkUpdate('RESOLVED') }}
            >
              Resolve All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
