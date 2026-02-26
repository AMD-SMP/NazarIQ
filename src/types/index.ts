export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Status = 'DETECTED' | 'ALERTED' | 'IN_PROGRESS' | 'RESOLVED'
export type HazardType =
  | 'POTHOLE' | 'WATERLOGGING' | 'FALLEN_TREE'
  | 'ROAD_COLLAPSE' | 'CONSTRUCTION_ZONE'
  | 'STRUCTURAL_FAILURE' | 'DEBRIS' | 'SEWAGE_OVERFLOW'
  | 'OTHER'
export type SourceName =
  | 'reddit_india' | 'ndtv_news' | 'times_of_india'
  | 'twitter_local' | 'citizen_report'
  | 'municipal_feed' | 'bbmp_official'
export type UserRole = 'public' | 'admin'
export type Theme = 'command' | 'municipal' | 'contrast'

export interface Coordinates {
  lat: number
  lng: number
}

export interface TimelineEntry {
  stage: Status
  timestamp: string
  note: string
  adminName?: string
}

export interface Incident {
  id: string
  type: HazardType
  title: string
  description: string
  city: string
  location: string
  coordinates: Coordinates
  severity: Severity
  riskScore: number
  status: Status
  source: SourceName
  sourceUrl: string
  rawExcerpt: string
  confidenceScore: number
  corroboratingReports: number
  aiSummary: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  assignedTo: string
  adminNotes: string
  timeline: TimelineEntry[]
}

export interface Source {
  name: SourceName
  displayName: string
  reliability: number
  totalReports: number
  verifiedReports: number
  falseReports: number
  status: 'TRUSTED' | 'MONITORING' | 'QUARANTINED'
  trend: number[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'ADMIN'
  lastLogin: string
  actionsCount: number
  avatar: string
}

export interface ActivityLog {
  id: string
  adminName: string
  action: 'STATUS_CHANGE' | 'NOTE_ADDED' | 'ALERT_SENT' | 'ESCALATED' | 'RESOLVED'
  incidentId: string
  oldValue: string
  newValue: string
  timestamp: string
  ipAddress: string
}

export interface Alert {
  id: string
  subject: string
  incidentId: string
  priority: Severity
  targetCities: string[]
  message: string
  sentBy: string
  sentAt: string
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED'
}
