import type { HazardType, Severity, Status, SourceName } from '@/types'

export const HAZARD_COLORS: Record<HazardType, string> = {
  POTHOLE: '#FF6B6B',
  WATERLOGGING: '#4ECDC4',
  FALLEN_TREE: '#45B7D1',
  ROAD_COLLAPSE: '#FF4757',
  CONSTRUCTION_ZONE: '#FFA502',
  STRUCTURAL_FAILURE: '#A55EEA',
  DEBRIS: '#778CA3',
  SEWAGE_OVERFLOW: '#26DE81',
}

export const HAZARD_LABELS: Record<HazardType, string> = {
  POTHOLE: 'Pothole',
  WATERLOGGING: 'Waterlogging',
  FALLEN_TREE: 'Fallen Tree',
  ROAD_COLLAPSE: 'Road Collapse',
  CONSTRUCTION_ZONE: 'Construction Zone',
  STRUCTURAL_FAILURE: 'Structural Failure',
  DEBRIS: 'Debris',
  SEWAGE_OVERFLOW: 'Sewage Overflow',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#6B7280',
}

export const STATUS_COLORS: Record<Status, string> = {
  DETECTED: '#06B6D4',
  ALERTED: '#F59E0B',
  IN_PROGRESS: '#A855F7',
  RESOLVED: '#22C55E',
}

export const SOURCE_LABELS: Record<SourceName, string> = {
  reddit_india: 'Reddit India',
  ndtv_news: 'NDTV News',
  times_of_india: 'Times of India',
  twitter_local: 'Twitter Local',
  citizen_report: 'Citizen Report',
  municipal_feed: 'Municipal Feed',
  bbmp_official: 'BBMP Official',
}

export const SOURCE_COLORS: Record<SourceName, string> = {
  reddit_india: '#FF4500',
  ndtv_news: '#E23744',
  times_of_india: '#1A73E8',
  twitter_local: '#1DA1F2',
  citizen_report: '#22C55E',
  municipal_feed: '#F59E0B',
  bbmp_official: '#7C3AED',
}

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
}

export const CITIES = Object.keys(CITY_COORDS)
