import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Severity, Status, HazardType, Incident, IncidentApiFilters, IncidentUpdateRequest } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incidentsApi } from '@/lib/incidentsApi'
import { queryKeys } from '@/lib/queryKeys'

const CITY_CANONICAL_LOOKUP: Record<string, string> = {
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  delhi: 'Delhi',
  new_delhi: 'Delhi',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  hyderabad: 'Hyderabad',
  chennai: 'Chennai',
  madras: 'Chennai',
  pune: 'Pune',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  ahmedabad: 'Ahmedabad',
  surat: 'Surat',
  jaipur: 'Jaipur',
  lucknow: 'Lucknow',
  nagpur: 'Nagpur',
  bhopal: 'Bhopal',
}
const CANONICAL_CITY_KEYS = Object.keys(CITY_CANONICAL_LOOKUP)

interface Filters {
  search: string
  cities: string[]
  severities: Severity[]
  statuses: Status[]
  hazardTypes: HazardType[]
  dateRange: '7D' | '30D' | '90D' | null
}

interface FilterContextType {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  resetFilters: () => void
  filteredIncidents: Incident[]
  incidents: Incident[]
  updateIncident: (id: string, updates: IncidentUpdateRequest) => Promise<Incident | void>
  incidentsLoading: boolean
  incidentsError: string | null
  refetchIncidents: () => Promise<unknown>
}

const defaultFilters: Filters = {
  search: '',
  cities: [],
  severities: [],
  statuses: [],
  hazardTypes: [],
  dateRange: null,
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const queryClient = useQueryClient()

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(defaultFilters), [])

  const apiFilters = useMemo<IncidentApiFilters>(() => ({
    search: filters.search || undefined,
    cities: filters.cities.length ? filters.cities : undefined,
    severities: filters.severities.length ? filters.severities : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    hazardTypes: filters.hazardTypes.length ? filters.hazardTypes : undefined,
    dateRange: filters.dateRange ?? undefined,
  }), [filters])

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.incidents.list(apiFilters),
    queryFn: () => incidentsApi.list(apiFilters),
    keepPreviousData: true,
  })

  const incidents = data?.data ?? []
  const filteredIncidents = useMemo(() => applyFilters(incidents, filters), [incidents, filters])

  const mutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: IncidentUpdateRequest }) => incidentsApi.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all }),
  })

  const updateIncident = useCallback((id: string, updates: IncidentUpdateRequest) => {
    return mutation.mutateAsync({ id, updates })
  }, [mutation])

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilter,
        resetFilters,
        filteredIncidents,
        incidents,
        updateIncident,
        incidentsLoading: isLoading,
        incidentsError: isError ? (error as Error)?.message ?? 'Failed to load incidents' : null,
        refetchIncidents: refetch,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}

function applyFilters(data: Incident[], filters: Filters) {
  return data.filter(incident => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const haystack = [
        incident.title,
        incident.id,
        incident.location,
        incident.city,
        incident.description,
      ].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (filters.cities.length && !filters.cities.some(city => incidentMatchesCity(incident, city))) {
      return false
    }

    if (filters.severities.length && !filters.severities.includes(incident.severity)) {
      return false
    }

    if (filters.statuses.length && !filters.statuses.includes(incident.status)) {
      return false
    }

    if (filters.hazardTypes.length && !filters.hazardTypes.includes(incident.type)) {
      return false
    }

    return true
  })
}

function normalizeCityKey(value?: string) {
  return value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? ''
}

function canonicalizeCityLabel(value?: string) {
  if (!value) return ''
  const normalized = normalizeCityKey(value)
  if (!normalized) return ''
  const direct = CITY_CANONICAL_LOOKUP[normalized]
  if (direct) return direct
  const fuzzy = CANONICAL_CITY_KEYS.find(key => normalized.includes(key))
  if (fuzzy) return CITY_CANONICAL_LOOKUP[fuzzy]
  return value.trim()
}

function incidentMatchesCity(incident: Incident, filterCity: string) {
  const canonicalFilter = canonicalizeCityLabel(filterCity) || filterCity
  const filterKey = normalizeCityKey(canonicalFilter)
  if (!filterKey) return false
  const candidates = [incident.city, incident.location, incident.title, incident.description]
  return candidates.some(candidate => cityCandidateMatches(candidate, filterKey))
}

function cityCandidateMatches(candidate: string | undefined, filterKey: string) {
  const normalized = normalizeCityKey(candidate)
  if (!normalized) return false
  if (normalized === filterKey) return true
  if (normalized.includes(filterKey)) return true
  const tokens = normalized.split(' ').filter(Boolean)
  return tokens.includes(filterKey)
}
