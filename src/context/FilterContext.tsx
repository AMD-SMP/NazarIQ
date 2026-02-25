import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Severity, Status, HazardType, Incident } from '@/types'
import { mockIncidents } from '@/data/mockIncidents'

interface Filters {
  search: string
  cities: string[]
  severities: Severity[]
  statuses: Status[]
  hazardTypes: HazardType[]
  dateRange: '7D' | '30D' | '90D'
}

interface FilterContextType {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  resetFilters: () => void
  filteredIncidents: Incident[]
  incidents: Incident[]
  updateIncident: (id: string, updates: Partial<Incident>) => void
}

const defaultFilters: Filters = {
  search: '',
  cities: [],
  severities: [],
  statuses: [],
  hazardTypes: [],
  dateRange: '30D',
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents)

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(defaultFilters), [])

  const updateIncident = useCallback((id: string, updates: Partial<Incident>) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...updates } : inc))
  }, [])

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      if (filters.search && !inc.title.toLowerCase().includes(filters.search.toLowerCase()) && !inc.id.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.cities.length && !filters.cities.includes(inc.city)) return false
      if (filters.severities.length && !filters.severities.includes(inc.severity)) return false
      if (filters.statuses.length && !filters.statuses.includes(inc.status)) return false
      if (filters.hazardTypes.length && !filters.hazardTypes.includes(inc.type)) return false
      return true
    })
  }, [incidents, filters])

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, filteredIncidents, incidents, updateIncident }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
