import { useEffect, useMemo, useRef, useState } from 'react'
import type { Incident, Severity } from '@/types'

interface LiveIncidentOptions {
  enabled?: boolean
  intervalMs?: number
}

const SEVERITY_SEQUENCE: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function getNextSeverity(current: Severity): Severity {
  const index = SEVERITY_SEQUENCE.indexOf(current)
  if (index === -1) return current
  return SEVERITY_SEQUENCE[(index + 1) % SEVERITY_SEQUENCE.length]
}

function cloneIncident(incident: Incident, overrides: Partial<Incident>): Incident {
  return { ...incident, ...overrides }
}

export function useLiveIncidents(baseIncidents: Incident[], options: LiveIncidentOptions = {}): Incident[] {
  const { enabled = false, intervalMs = 8000 } = options
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>(baseIncidents)
  const baseRef = useRef(baseIncidents)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    baseRef.current = baseIncidents
    setLiveIncidents(baseIncidents)
  }, [baseIncidents])

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = window.setInterval(() => {
      setLiveIncidents(prev => {
        if (!prev.length) return prev
        const idx = Math.floor(Math.random() * prev.length)
        const target = prev[idx]
        if (!target) return prev
        const updated = cloneIncident(target, { severity: getNextSeverity(target.severity) })
        const next = [...prev]
        next[idx] = updated
        return next
      })
    }, intervalMs)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, intervalMs])

  return useMemo(() => liveIncidents, [liveIncidents])
}
