import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import {
  MongoClient,
  ObjectId,
  type Collection,
  type Document,
  type Filter,
  type WithId,
} from 'mongodb'
import type { ActivityLog, Alert, HazardType, Incident, IncidentApiFilters, Severity, Status, TimelineEntry } from '../src/types'
import { buildTrendAnalytics } from './trendAnalytics'

dotenv.config()

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const PORT = Number(process.env.API_PORT ?? 4000)
const {
  MONGODB_URI,
  MONGODB_DB = 'civic_hazard_db',
  MONGODB_INCIDENTS_COLLECTION = 'india_incidents',
} = process.env

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment variables.')
  process.exit(1)
}

const client = new MongoClient(MONGODB_URI)

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 }
const SEVERITY_BASE: Record<Severity, number> = {
  CRITICAL: 90,
  HIGH: 75,
  MEDIUM: 55,
  LOW: 35,
}
const hazardLookup: Record<string, HazardType> = {
  pothole: 'POTHOLE',
  potholes: 'POTHOLE',
  waterlogging: 'WATERLOGGING',
  water_log: 'WATERLOGGING',
  flood: 'WATERLOGGING',
  flooding: 'WATERLOGGING',
  fallen_tree: 'FALLEN_TREE',
  treefall: 'FALLEN_TREE',
  landslide: 'ROAD_COLLAPSE',
  road_collapse: 'ROAD_COLLAPSE',
  sinkhole: 'ROAD_COLLAPSE',
  construction: 'CONSTRUCTION_ZONE',
  debris: 'DEBRIS',
  structural_failure: 'STRUCTURAL_FAILURE',
  sewage: 'SEWAGE_OVERFLOW',
  sewage_overflow: 'SEWAGE_OVERFLOW',
}
const severityLookup: Record<string, Severity> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}
const statusLookup: Record<string, Status> = {
  detected: 'DETECTED',
  alerted: 'ALERTED',
  in_progress: 'IN_PROGRESS',
  ongoing: 'IN_PROGRESS',
  active: 'IN_PROGRESS',
  resolved: 'RESOLVED',
}

const CITY_CANONICAL_LOOKUP: Record<string, string> = {
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  delhi: 'Delhi',
  new_delhi: 'Delhi',
  ncr: 'Delhi',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  hyderabad: 'Hyderabad',
  secunderabad: 'Hyderabad',
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

let alertStore: Map<string, Alert> | null = null

type IncidentUpdatePayload = {
  status?: Status | string | null
  adminNotes?: string | null
  assignedTo?: string | null
}

interface IncidentDoc extends WithId<Document> {
  hazard_type?: string
  hazardType?: string
  severity?: string
  status?: string
  coordinates?: { lat?: number; lng?: number; latitude?: number; longitude?: number }
    | number[]
    | { type?: string; coordinates?: number[] }
  location_name?: string
  location?: string
  city?: string
  datetime?: string
  createdAt?: string
  updatedAt?: string
  resolvedAt?: string | null
  summary?: string
  description?: string
  title?: string
  source?: string
  sourceUrl?: string
  confidence?: number
  confidenceScore?: number
  corroboratingReports?: number
  riskScore?: number
  rawExcerpt?: string
  assignedTo?: string
  adminNotes?: string
  timeline?: TimelineEntry[]
}

let cachedCollection: Collection<IncidentDoc> | null = null

async function getIncidentsCollection(): Promise<Collection<IncidentDoc>> {
  if (!cachedCollection) {
    await client.connect()
    cachedCollection = client.db(MONGODB_DB).collection<IncidentDoc>(MONGODB_INCIDENTS_COLLECTION)
  }
  return cachedCollection
}

function normalizeKey(value?: string | null) {
  return value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? ''
}

function normalizeHazardType(value?: string | null): HazardType {
  const normalized = normalizeKey(value)
  return hazardLookup[normalized] ?? 'OTHER'
}

function normalizeSeverity(value?: string | null): Severity {
  const normalized = normalizeKey(value)
  return severityLookup[normalized] ?? 'MEDIUM'
}

function normalizeStatusValue(value?: string | null): Status | undefined {
  const normalized = normalizeKey(value)
  return statusLookup[normalized]
}

function normalizeStatus(value: string | undefined | null, severity: Severity): Status {
  const mapped = normalizeStatusValue(value)
  if (mapped) return mapped
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'IN_PROGRESS'
  return 'DETECTED'
}

function parseConfidence(doc: IncidentDoc) {
  const confidence = Number(doc.confidence ?? doc.confidenceScore)
  if (Number.isFinite(confidence)) return Math.min(100, Math.max(0, confidence))
  return 62
}

function normalizeCoordinates(value: IncidentDoc['coordinates']) {
  const coords = value as unknown
  let lat: number | undefined
  let lng: number | undefined

  if (!coords) return { ...INDIA_CENTER }

  if (Array.isArray(coords) && coords.length >= 2) {
    lng = Number(coords[0])
    lat = Number(coords[1])
  } else if (typeof coords === 'object') {
    const maybeGeo = coords as { type?: string; coordinates?: number[] }
    if (Array.isArray(maybeGeo.coordinates) && maybeGeo.coordinates.length >= 2) {
      lng = Number(maybeGeo.coordinates[0])
      lat = Number(maybeGeo.coordinates[1])
    }
    lat = lat ?? Number((coords as { lat?: number }).lat ?? (coords as { latitude?: number }).latitude)
    lng = lng ?? Number((coords as { lng?: number }).lng ?? (coords as { longitude?: number }).longitude)
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ...INDIA_CENTER }
  return { lat: lat as number, lng: lng as number }
}

function normalizeCity(doc: IncidentDoc) {
  const explicit = canonicalizeCity(doc.city?.toString())
  if (explicit) return explicit

  const locationSource = doc.location_name ?? doc.location
  const inferred = canonicalizeCity(extractCityFromLocation(locationSource))
  if (inferred) return inferred

  const fallback = sanitizeCity(doc.city ?? locationSource)
  return fallback || 'Unknown'
}

function sanitizeCity(value?: string | null) {
  if (!value) return ''
  return value.replace(/\s+/g, ' ').trim()
}

function canonicalizeCity(value?: string | null) {
  if (!value) return null
  const normalized = normalizeCityKey(value)
  if (!normalized) return null
  const direct = CITY_CANONICAL_LOOKUP[normalized]
  if (direct) return direct
  const fuzzy = CANONICAL_CITY_KEYS.find(key => normalized.includes(key))
  if (fuzzy) return CITY_CANONICAL_LOOKUP[fuzzy]
  return sanitizeCity(value)
}

const ALERT_STATUS_VALUES: Alert['status'][] = ['SENT', 'DELIVERED', 'ACKNOWLEDGED', 'FAILED']

async function ensureAlertStore(options?: { force?: boolean }) {
  if (alertStore && !options?.force) {
    return alertStore
  }
  const { docs } = await fetchIncidents({ dateRange: '7D' }, { limit: 300 })
  const incidents = docs.map(toIncident)
  const alerts = buildAdminAlerts(incidents)
  alertStore = new Map(alerts.map(alert => [alert.id, alert]))
  return alertStore
}

function buildAdminAlerts(incidents: Incident[]): Alert[] {
  return incidents
    .filter(incident => incident.severity === 'CRITICAL' || incident.severity === 'HIGH' || incident.status !== 'RESOLVED')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 80)
    .map(incident => ({
      id: incident.id,
      subject: formatAlertSubject(incident),
      incidentId: incident.id,
      priority: incident.severity,
      targetCities: [incident.city].filter(Boolean),
      message: incident.aiSummary || incident.description || incident.title,
      sentBy: incident.assignedTo && incident.assignedTo !== 'Unassigned' ? incident.assignedTo : 'Ops Automation',
      sentAt: incident.updatedAt || incident.createdAt,
      status: inferAlertStatus(incident),
    }))
}

function inferAlertStatus(incident: Incident): Alert['status'] {
  if (incident.status === 'RESOLVED') return 'ACKNOWLEDGED'
  if (incident.status === 'IN_PROGRESS') return 'DELIVERED'
  return 'SENT'
}

function formatAlertSubject(incident: Incident) {
  const severityLabel = incident.severity === 'CRITICAL' ? 'Critical' : incident.severity === 'HIGH' ? 'High' : 'Alert'
  return `${severityLabel}: ${incident.title}`
}

function isValidAlertStatus(value: unknown): value is Alert['status'] {
  return typeof value === 'string' && ALERT_STATUS_VALUES.includes(value as Alert['status'])
}

function extractCityFromLocation(value?: string | null) {
  if (!value) return null
  const normalized = value.replace(/[|–—-]/g, ',')
  const parts = normalized
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  if (!parts.length) return null

  let candidate = parts[parts.length - 1]
  if (candidate.length <= 2 && parts.length > 1) {
    candidate = parts[parts.length - 2]
  }

  return candidate ? sanitizeCity(candidate) : null
}

function normalizeLocation(doc: IncidentDoc) {
  return doc.location_name ?? doc.location ?? normalizeCity(doc)
}

function buildTimeline(doc: IncidentDoc, status: Status, createdAt: string, updatedAt: string): TimelineEntry[] {
  const existing = (doc.timeline ?? []).filter(entry => entry?.stage && entry?.timestamp)
  if (existing.length) return existing
  const base: TimelineEntry[] = [
    {
      stage: 'DETECTED',
      timestamp: createdAt,
      note: doc.source ? `Detected via ${doc.source}` : 'Reported via public stream',
    },
  ]
  if (status !== 'DETECTED') {
    base.push({
      stage: status,
      timestamp: updatedAt,
      note: 'Status inferred from live feed',
      adminName: 'Automated Inference',
    })
  }
  return base
}

function buildIncidentUpdate(existing: IncidentDoc, payload: IncidentUpdatePayload) {
  const normalizedSeverity = normalizeSeverity(existing.severity)
  const nowIso = new Date().toISOString()
  const updates: Partial<IncidentDoc> = {
    updatedAt: nowIso,
  }
  let appliedStatus = normalizeStatus(existing.status, normalizedSeverity)

  if (payload.status) {
    appliedStatus = normalizeStatus(payload.status, normalizedSeverity)
    updates.status = appliedStatus
  }

  if (typeof payload.adminNotes === 'string') {
    updates.adminNotes = payload.adminNotes
  }

  if (typeof payload.assignedTo === 'string') {
    updates.assignedTo = payload.assignedTo
  }

  const timeline = existing.timeline ? [...existing.timeline] : buildTimeline(existing, appliedStatus, existing.datetime ?? nowIso, nowIso)

  if (payload.status) {
    timeline.push({
      stage: appliedStatus,
      timestamp: nowIso,
      note: payload.adminNotes ? `Status update: ${payload.adminNotes}` : 'Status updated via admin console',
      adminName: 'Admin Console',
    })
  } else if (typeof payload.adminNotes === 'string' && payload.adminNotes.trim()) {
    timeline.push({
      stage: timeline.at(-1)?.stage ?? appliedStatus,
      timestamp: nowIso,
      note: payload.adminNotes,
      adminName: 'Admin Console',
    })
  }

  updates.timeline = timeline
  return { updates, appliedStatus }
}

async function applyIncidentUpdate(id: string, payload: IncidentUpdatePayload) {
  if (!ObjectId.isValid(id)) {
    throw new HttpError(400, 'Invalid incident id')
  }
  const collection = await getIncidentsCollection()
  const objectId = new ObjectId(id)
  const existing = await collection.findOne({ _id: objectId })
  if (!existing) {
    throw new HttpError(404, 'Incident not found')
  }
  const { updates } = buildIncidentUpdate(existing, payload)
  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updates },
    { returnDocument: 'after' },
  )
  const doc = (result.value ?? { ...existing, ...updates }) as IncidentDoc
  return toIncident(doc)
}

function extractIncidentUpdatePayload(body: unknown): IncidentUpdatePayload | null {
  if (!body || typeof body !== 'object') return null
  const candidate = body as Record<string, unknown>
  const payload: IncidentUpdatePayload = {}
  if (typeof candidate.status === 'string') payload.status = candidate.status as Status
  if (typeof candidate.adminNotes === 'string') payload.adminNotes = candidate.adminNotes
  if (typeof candidate.assignedTo === 'string') payload.assignedTo = candidate.assignedTo
  return Object.keys(payload).length ? payload : null
}

function computeRiskScore(doc: IncidentDoc, severity: Severity, createdAt: string) {
  const base = SEVERITY_BASE[severity]
  const confidence = parseConfidence(doc)
  const createdTime = Date.parse(createdAt)
  const hoursOld = Number.isFinite(createdTime) ? (Date.now() - createdTime) / 36e5 : 0
  const recencyBoost = hoursOld <= 6 ? 12 : hoursOld <= 24 ? 8 : hoursOld <= 72 ? 4 : 0
  return Math.min(100, Math.round(base + confidence * 0.3 + recencyBoost))
}

function deriveSourceName(raw?: string) {
  const normalized = normalizeKey(raw)
  const sources = ['reddit_india', 'citizen_report', 'municipal_feed', 'twitter_local', 'ndtv_news', 'times_of_india', 'bbmp_official'] as const
  const match = sources.find(src => src === normalized)
  return match ?? 'citizen_report'
}

function toIncident(doc: IncidentDoc): Incident {
  const severity = normalizeSeverity(doc.severity)
  const status = normalizeStatus(doc.status, severity)
  const createdAt = doc.datetime ?? doc.createdAt ?? new Date().toISOString()
  const updatedAt = doc.updatedAt ?? createdAt
  const coordinates = normalizeCoordinates(doc.coordinates)
  const riskScore = doc.riskScore ?? computeRiskScore(doc, severity, createdAt)
  const incident: Incident = {
    id: doc._id.toString(),
    type: normalizeHazardType(doc.hazard_type ?? doc.hazardType),
    title: doc.title ?? doc.summary ?? `${normalizeHazardType(doc.hazard_type ?? doc.hazardType)} hazard`,
    description: doc.description ?? doc.summary ?? 'No additional description provided.',
    city: normalizeCity(doc),
    location: normalizeLocation(doc),
    coordinates,
    severity,
    riskScore,
    status,
    source: deriveSourceName(doc.source),
    sourceUrl: doc.sourceUrl ?? '#',
    rawExcerpt: doc.rawExcerpt ?? doc.summary ?? '',
    confidenceScore: parseConfidence(doc),
    corroboratingReports: doc.corroboratingReports ?? 1,
    aiSummary: doc.summary ?? doc.description ?? 'Summary unavailable.',
    createdAt,
    updatedAt,
    resolvedAt: doc.resolvedAt ?? null,
    assignedTo: doc.assignedTo ?? 'Unassigned',
    adminNotes: doc.adminNotes ?? '',
    timeline: buildTimeline(doc, status, createdAt, updatedAt),
  }
  return incident
}

function parseArrayParam(value?: undefined | string | string[]) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean)
  }
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

function dateRangeToMs(range?: unknown) {
  if (range === '7D') return 7 * 24 * 60 * 60 * 1000
  if (range === '30D') return 30 * 24 * 60 * 60 * 1000
  if (range === '90D') return 90 * 24 * 60 * 60 * 1000
  return null
}

function extractFilters(query: Record<string, unknown>): IncidentApiFilters | undefined {
  const search = query.search?.toString().trim()
  const cities = parseArrayParam(query.cities as string | string[] | undefined)
  const severities = parseArrayParam(query.severities as string | string[] | undefined)
    .map(value => normalizeSeverity(value))
  const statuses = parseArrayParam(query.statuses as string | string[] | undefined)
    .map(value => normalizeStatusValue(value))
    .filter((value): value is Status => Boolean(value))
  const hazardTypes = parseArrayParam(query.hazardTypes as string | string[] | undefined)
    .map(value => normalizeHazardType(value))
  const dateRange = (query.dateRange as IncidentApiFilters['dateRange']) ?? undefined

  const filters: IncidentApiFilters = {}
  if (search) filters.search = search
  if (cities.length) filters.cities = cities
  if (severities.length) filters.severities = severities
  if (statuses.length) filters.statuses = statuses
  if (hazardTypes.length) filters.hazardTypes = hazardTypes
  if (dateRange) filters.dateRange = dateRange

  return Object.keys(filters).length ? filters : undefined
}

function matchesFilters(incident: Incident, filters?: IncidentApiFilters) {
  if (!filters) return true

  if (filters.search) {
    const q = filters.search.toLowerCase()
    const haystack = [incident.title, incident.id, incident.location, incident.city].join(' ').toLowerCase()
    if (!haystack.includes(q)) {
      return false
    }
  }

  if (filters.cities?.length && !matchesCityFilters(incident, filters.cities)) return false
  if (filters.severities?.length && !filters.severities.includes(incident.severity)) return false
  if (filters.statuses?.length && !filters.statuses.includes(incident.status)) return false
  if (filters.hazardTypes?.length && !filters.hazardTypes.includes(incident.type)) return false

  if (filters.dateRange) {
    const rangeMs = dateRangeToMs(filters.dateRange)
    if (rangeMs) {
      const createdTime = Date.parse(incident.createdAt)
      if (Number.isFinite(createdTime)) {
        const withinRange = Date.now() - createdTime <= rangeMs
        if (!withinRange) return false
      }
    }
  }

  return true
}

function normalizeCityKey(value?: string) {
  return value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? ''
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildCityRegex(value: string) {
  const normalized = normalizeCityKey(value)
  if (!normalized) return null
  const tokens = normalized.split(' ').filter(Boolean)
  if (!tokens.length) return null
  const pattern = tokens.map(token => escapeRegex(token)).join('.*')
  return new RegExp(pattern, 'i')
}

function matchesCityFilters(incident: Incident, filters: string[]) {
  const candidates = [incident.city, incident.location, incident.title, incident.description].filter(Boolean)
  if (!candidates.length) return false

  return filters.some(filterCity => {
    const canonicalFilter = canonicalizeCity(filterCity) ?? filterCity
    const normalizedFilter = normalizeCityKey(canonicalFilter)
    if (!normalizedFilter) return false
    return candidates.some(candidate => cityCandidateMatches(candidate, normalizedFilter))
  })
}

function cityCandidateMatches(candidate: string | undefined, normalizedFilter: string) {
  const normalizedCandidate = normalizeCityKey(candidate)
  if (!normalizedCandidate) return false
  if (normalizedCandidate === normalizedFilter) return true
  if (normalizedCandidate.includes(normalizedFilter)) return true
  const tokens = normalizedCandidate.split(' ').filter(Boolean)
  return tokens.includes(normalizedFilter)
}

function filterIncidents(incidents: Incident[], filters?: IncidentApiFilters) {
  if (!filters) return incidents
  return incidents.filter(incident => matchesFilters(incident, filters))
}

const STAGE_ACTION_MAP: Record<Status, ActivityLog['action']> = {
  DETECTED: 'ALERT_SENT',
  ALERTED: 'ALERT_SENT',
  IN_PROGRESS: 'STATUS_CHANGE',
  RESOLVED: 'RESOLVED',
}

function mapStageToAction(stage: Status, severity: Severity): ActivityLog['action'] {
  const base = STAGE_ACTION_MAP[stage] ?? 'STATUS_CHANGE'
  if (severity === 'CRITICAL' && base === 'STATUS_CHANGE') {
    return 'ESCALATED'
  }
  return base
}

function buildActivityLogs(incidents: Incident[]): ActivityLog[] {
  const logs: ActivityLog[] = []
  incidents.forEach(incident => {
    const timeline = incident.timeline ?? []
    timeline.forEach((entry, index) => {
      if (!entry?.timestamp) return
      const previousStage = timeline[index - 1]?.stage ?? 'N/A'
      logs.push({
        id: `${incident.id}-${index}`,
        adminName: entry.adminName ?? (entry.stage === 'DETECTED' ? 'Automated Watcher' : 'Ops Automation'),
        action: mapStageToAction(entry.stage, incident.severity),
        incidentId: incident.id,
        oldValue: previousStage,
        newValue: entry.note ?? entry.stage,
        timestamp: entry.timestamp,
        ipAddress: '127.0.0.1',
      })
    })
  })

  return logs.sort((a, b) => {
    return Date.parse(b.timestamp) - Date.parse(a.timestamp)
  })
}

function buildMongoFilter(filters?: IncidentApiFilters): Filter<IncidentDoc> {
  const andConditions: Document[] = []

  const search = filters?.search
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    andConditions.push({
      $or: [
        { title: regex },
        { summary: regex },
        { location_name: regex },
        { location: regex },
      ],
    })
  }

  const dateRangeMs = filters?.dateRange ? dateRangeToMs(filters.dateRange) : null
  if (dateRangeMs) {
    const gteIso = new Date(Date.now() - dateRangeMs).toISOString()
    andConditions.push({
      $or: [
        { datetime: { $gte: gteIso } },
        { createdAt: { $gte: gteIso } },
      ],
    })
  }

  if (!andConditions.length) return {}
  return { $and: andConditions }
}

async function fetchIncidents(query: Record<string, unknown>, options?: { limit?: number; filters?: IncidentApiFilters }) {
  const collection = await getIncidentsCollection()
  const filters = options?.filters ?? extractFilters(query)
  const mongoFilter = buildMongoFilter(pickMongoFilters(filters))
  const limit = options?.limit ?? 250
  const cursor = collection.find(mongoFilter).sort({ datetime: -1, createdAt: -1 }).limit(limit)
  const [docs, total] = await Promise.all([
    cursor.toArray(),
    collection.countDocuments(mongoFilter),
  ])
  return { docs, total }
}

function pickMongoFilters(filters?: IncidentApiFilters): IncidentApiFilters | undefined {
  if (!filters) return undefined
  const mongoFilters: IncidentApiFilters = {}
  if (filters.search) mongoFilters.search = filters.search
  if (filters.dateRange) mongoFilters.dateRange = filters.dateRange
  return Object.keys(mongoFilters).length ? mongoFilters : undefined
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    name: 'NazarIQ API',
    status: 'ok',
    endpoints: ['/health', '/api/incidents', '/api/incidents/:id'],
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/incidents', async (req, res, next) => {
  try {
    const filters = extractFilters(req.query)
    const { docs, total } = await fetchIncidents(req.query, { filters })
    const incidents = docs.map(toIncident)
    const filtered = filterIncidents(incidents, filters)
    res.json({ data: filtered, total: filters ? filtered.length : total })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/alerts', async (req, res, next) => {
  try {
    const force = req.query.refresh === 'true'
    const store = await ensureAlertStore({ force })
    res.json(Array.from(store.values()))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/alerts/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body ?? {}
    if (!isValidAlertStatus(status)) {
      return res.status(400).json({ message: 'Invalid alert status' })
    }
    const store = await ensureAlertStore()
    const existing = store.get(id)
    if (!existing) {
      return res.status(404).json({ message: 'Alert not found' })
    }
    const updated: Alert = { ...existing, status }
    store.set(id, updated)
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/alerts/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const store = await ensureAlertStore()
    if (!store.has(id)) {
      return res.status(404).json({ message: 'Alert not found' })
    }
    store.delete(id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/activity', async (req, res, next) => {
  try {
    const range = (req.query.dateRange as IncidentApiFilters['dateRange']) ?? '30D'
    const { docs } = await fetchIncidents({ ...req.query, dateRange: range }, { limit: 200 })
    const incidents = docs.map(toIncident)
    const logs = buildActivityLogs(incidents)
    res.json(logs.slice(0, 80))
  } catch (error) {
    next(error)
  }
})

app.get('/api/trends', async (req, res, next) => {
  try {
    const rangeParam = (req.query.range as '7D' | '30D' | '90D' | undefined) ?? '30D'
    const range = rangeParam === '7D' || rangeParam === '90D' ? rangeParam : '30D'
    const query = { ...req.query, dateRange: range }
    const { docs } = await fetchIncidents(query, { limit: 1200 })
    const incidents = docs.map(toIncident)
    const analytics = buildTrendAnalytics(incidents, range)
    res.json(analytics)
  } catch (error) {
    next(error)
  }
})

app.get('/api/incidents/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid incident id' })
    }
    const collection = await getIncidentsCollection()
    const doc = await collection.findOne({ _id: new ObjectId(id) })
    if (!doc) {
      return res.status(404).json({ message: 'Incident not found' })
    }
    res.json(toIncident(doc))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/incidents/:id', async (req, res, next) => {
  try {
    const payload = extractIncidentUpdatePayload(req.body)
    if (!payload) {
      return res.status(400).json({ message: 'No supported fields provided' })
    }
    const incident = await applyIncidentUpdate(req.params.id, payload)
    res.json(incident)
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/incidents/bulk-status', async (req, res, next) => {
  try {
    const payload = extractIncidentUpdatePayload(req.body)
    const ids = Array.isArray(req.body?.ids) ? Array.from(new Set(req.body.ids.filter((id: unknown) => typeof id === 'string'))) : []
    if (!ids.length) {
      return res.status(400).json({ message: 'No incident ids provided' })
    }
    if (!payload) {
      return res.status(400).json({ message: 'No supported fields provided' })
    }

    const results: Incident[] = []
    const errors: { id: string; message: string }[] = []

    await Promise.all(ids.map(async id => {
      try {
        const incident = await applyIncidentUpdate(id, payload)
        results.push(incident)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed'
        errors.push({ id, message })
      }
    }))

    res.json({ data: results, updated: results.length, errors })
  } catch (error) {
    next(error)
  }
})

app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  const status = typeof err.status === 'number' ? err.status : 500
  res.status(status).json({ message: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`NazarIQ API server running on http://localhost:${PORT}`)
})
