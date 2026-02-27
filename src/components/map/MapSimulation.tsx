/**
 * NOTE:
 * Google Maps requires billing to be enabled.
 * $200/month free credit applies.
 * API key must be restricted to trusted HTTP referrers and the Maps JavaScript API only.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer, type MarkerClustererOptions } from '@googlemaps/markerclusterer'
import { useNavigate } from 'react-router-dom'
import type { Incident, Severity } from '@/types'
import { useLiveIncidents } from '@/hooks/useLiveIncidents'
import { useThemeContext } from '@/context/ThemeContext'
import { CITY_COORDS } from '@/lib/constants'

type MapStyleMode = 'light' | 'dark'

interface Props {
  incidents: Incident[]
  mapStyle?: MapStyleMode
  focusCity?: string
}

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 }

const HEATMAP_GRADIENT = [
  'rgba(0,255,0,0)',
  'rgba(0,255,0,1)',
  'rgba(255,255,0,1)',
  'rgba(255,165,0,1)',
  'rgba(255,0,0,1)',
]

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const SEVERITY_COLOR_MAP: Record<Severity, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#facc15',
  LOW: '#22c55e',
}

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f2937' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
]

const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5f5' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#cbd5f5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#bfdbfe' }],
  },
]

const ENABLE_LIVE_FEED = true
const HEATMAP_RADIUS = 35
const HEATMAP_OPACITY = 0.7

type HeatPointSeed = { lat: number; lng: number; weight: number }

export const MapSimulation = React.memo(function MapSimulation({ incidents, mapStyle, focusCity }: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { theme } = useThemeContext()
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [styleMode, setStyleMode] = useState<MapStyleMode>(mapStyle ?? (theme === 'municipal' ? 'light' : 'dark'))
  const [manualStyle, setManualStyle] = useState<boolean>(() => Boolean(mapStyle))
  const navigate = useNavigate()

  const baseIncidents = useMemo(() => incidents ?? [], [incidents])
  const incidentsWithLive = useLiveIncidents(baseIncidents, { enabled: ENABLE_LIVE_FEED })

  useEffect(() => {
    if (mapStyle) {
      setStyleMode(mapStyle)
      setManualStyle(true)
      return
    }
    if (!manualStyle) {
      const inferred: MapStyleMode = theme === 'municipal' ? 'light' : 'dark'
      setStyleMode(inferred)
    }
  }, [theme, mapStyle, manualStyle])

  const normalizedIncidents = useMemo(
    () =>
      incidentsWithLive.filter(
        inc => typeof inc.coordinates?.lat === 'number' && typeof inc.coordinates?.lng === 'number',
      ),
    [incidentsWithLive],
  )

  const heatSeeds = useMemo<HeatPointSeed[]>(
    () =>
      normalizedIncidents.map(inc => ({
        lat: inc.coordinates.lat,
        lng: inc.coordinates.lng,
        weight: SEVERITY_WEIGHTS[inc.severity] ?? 1,
      })),
    [normalizedIncidents],
  )

  const hasIncidents = normalizedIncidents.length > 0

  const handleToggle = useCallback(() => {
    setShowHeatmap(prev => !prev)
  }, [])

  const mapOptions = useMemo(() => {
    const styleSet = styleMode === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE
    return {
      styles: styleSet,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      backgroundColor: styleMode === 'dark' ? '#020617' : '#ffffff',
    }
  }, [styleMode])

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-lg border border-border bg-card">
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={handleToggle}
          className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${showHeatmap ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
        >
          Heatmap
        </button>
      </div>
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {(['dark', 'light'] as MapStyleMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => { setStyleMode(mode); setManualStyle(true) }}
            className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${styleMode === mode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {mode}
          </button>
        ))}
        {!mapStyle && (
          <button
            onClick={() => { setManualStyle(false) }}
            className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${!manualStyle ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            Auto
          </button>
        )}
      </div>

      {!apiKey ? (
        <div className="flex h-full min-h-[400px] w-full items-center justify-center text-center text-xs text-muted-foreground">
          <p>Google Maps API key missing. Add VITE_GOOGLE_MAPS_API_KEY to the .env file.</p>
        </div>
      ) : (
        <APIProvider apiKey={apiKey} libraries={['visualization']}>
          <Map
            id="nazar-map"
            className="h-full w-full min-h-[400px]"
            defaultZoom={5}
            defaultCenter={INDIA_CENTER}
            gestureHandling="greedy"
            mapTypeControl={false}
            fullscreenControl={false}
            streetViewControl={false}
            options={mapOptions as google.maps.MapOptions}
          >
            <MapStyleController options={mapOptions as google.maps.MapOptions} />
            <AutoFocusController focusCity={focusCity} incidents={normalizedIncidents} />
            {hasIncidents ? (
              <>
                <ClusteredMarkers
                  incidents={normalizedIncidents}
                  onMarkerClick={(incidentId) => navigate(`/incident/${incidentId}`)}
                />
                <HeatLayer points={heatSeeds} showHeatmap={showHeatmap} />
              </>
            ) : (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                No incidents match the current filters.
              </div>
            )}
          </Map>
        </APIProvider>
      )}
    </div>
  )
})

interface AutoFocusControllerProps {
  incidents: Incident[]
  focusCity?: string
}

const AutoFocusController: React.FC<AutoFocusControllerProps> = ({ incidents, focusCity }) => {
  const map = useMap()
  const lastFocusRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps) return

    if (!focusCity) {
      if (lastFocusRef.current) {
        map.panTo(INDIA_CENTER)
        map.setZoom(5)
        lastFocusRef.current = undefined
      }
      return
    }

    const normalized = focusCity.toLowerCase()
    const matches = incidents.filter(inc => inc.city.toLowerCase() === normalized)

    if (matches.length) {
      const bounds = new googleMaps.maps.LatLngBounds()
      matches.forEach(inc => bounds.extend(inc.coordinates))
      map.fitBounds(bounds, { left: 32, right: 32, top: 64, bottom: 64 })
      if (map.getZoom() > 13) {
        map.setZoom(13)
      }
    } else if (CITY_COORDS[focusCity]) {
      map.panTo(CITY_COORDS[focusCity])
      map.setZoom(11)
    }

    lastFocusRef.current = focusCity
  }, [map, focusCity, incidents])

  return null
}

interface ClusteredMarkersProps {
  incidents: Incident[]
  onMarkerClick: (incidentId: string) => void
}

const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({ incidents, onMarkerClick }) => {
  const map = useMap()
  const clusterRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const animationTimersRef = useRef<number[]>([])

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps) {
      return
    }

    const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    const createIcon = (severity: Severity): google.maps.Symbol => {
      const color = SEVERITY_COLOR_MAP[severity] ?? '#94a3b8'
      const isCritical = severity === 'CRITICAL'
      return {
        path: googleMaps.maps.SymbolPath.CIRCLE,
        scale: isCritical ? 9 : 7,
        fillColor: color,
        fillOpacity: 0.95,
        strokeColor: isCritical ? '#fde68a' : '#0f172a',
        strokeOpacity: isCritical ? 0.9 : 0.4,
        strokeWeight: isCritical ? 2.2 : 1.2,
      }
    }

    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer))
    animationTimersRef.current = []

    if (!incidents.length) {
      clusterRef.current?.clearMarkers()
      return
    }

    markersRef.current = incidents.map((incident) => {
      const marker = new googleMaps.maps.Marker({
        position: incident.coordinates,
        title: incident.title,
        icon: createIcon(incident.severity),
        zIndex: incident.severity === 'CRITICAL' ? 2000 : 1000 - severityOrder.indexOf(incident.severity),
        optimized: true,
      })

      marker.addListener('click', () => onMarkerClick(incident.id))

      if (incident.severity === 'CRITICAL') {
        marker.setAnimation(googleMaps.maps.Animation.BOUNCE)
        const timeout = window.setTimeout(() => marker.setAnimation(null), 2600)
        animationTimersRef.current.push(timeout)
      }

      return marker
    })

    if (!clusterRef.current) {
      clusterRef.current = new MarkerClusterer({
        markers: [],
        map,
        renderer: createClusterRenderer(googleMaps),
      })
    }

    clusterRef.current.clearMarkers()
    clusterRef.current.addMarkers(markersRef.current)

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
      animationTimersRef.current.forEach(timer => window.clearTimeout(timer))
      animationTimersRef.current = []
    }
  }, [map, incidents, onMarkerClick])

  useEffect(() => {
    return () => {
      clusterRef.current?.clearMarkers()
      clusterRef.current?.setMap(null)
      clusterRef.current = null
    }
  }, [])

  return null
}

interface HeatLayerProps {
  points: HeatPointSeed[]
  showHeatmap: boolean
}

const HeatLayer: React.FC<HeatLayerProps> = ({ points, showHeatmap }) => {
  const map = useMap()
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google

    if (!map || !googleMaps || !googleMaps.maps?.visualization) {
      return
    }

    if (!heatmapRef.current) {
      heatmapRef.current = new googleMaps.maps.visualization.HeatmapLayer({
        radius: HEATMAP_RADIUS,
        opacity: HEATMAP_OPACITY,
        gradient: HEATMAP_GRADIENT,
      })
    }

    const weightedLocations = points.map(point => ({
      location: new googleMaps.maps.LatLng(point.lat, point.lng),
      weight: point.weight,
    }))

    const heatmap = heatmapRef.current
    if (weightedLocations.length && showHeatmap) {
      heatmap.setData(weightedLocations)
      heatmap.setMap(map)
    } else {
      heatmap.setData([])
      heatmap.setMap(null)
    }

    return () => {
      if (!showHeatmap) {
        heatmap.setMap(null)
      }
    }
  }, [map, points, showHeatmap])

  useEffect(() => {
    return () => {
      heatmapRef.current?.setMap(null)
      heatmapRef.current = null
    }
  }, [])

  return null
}

function createClusterRenderer(googleMaps: typeof google): MarkerClustererOptions['renderer'] {
  return {
    render: ({ count, position }) => {
      const safeCount = count || 1
      const size = 30 + Math.log(safeCount) * 10
      const color = safeCount < 5 ? '#22c55e' : safeCount <= 10 ? '#f97316' : '#ef4444'
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}" flood-opacity="0.35" />
            </filter>
          </defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" filter="url(#shadow)" />
          <text x="50%" y="52%" text-anchor="middle" font-family="'Inter', sans-serif" font-size="${Math.max(12, size / 3)}" font-weight="700" fill="#0f172a">${safeCount}</text>
        </svg>`

      return new googleMaps.maps.Marker({
        position,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new googleMaps.maps.Size(size, size),
          anchor: new googleMaps.maps.Point(size / 2, size / 2),
        },
        zIndex: 1000 + safeCount,
        optimized: true,
      })
    },
  }
}

const MapStyleController: React.FC<{ options: google.maps.MapOptions }> = ({ options }) => {
  const map = useMap()

  useEffect(() => {
    if (map) {
      map.setOptions(options)
    }
  }, [map, options])

  return null
}
