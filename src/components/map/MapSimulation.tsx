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

/**
 * Zoom-Adaptive Rendering Overview
 *
 * Static heatmap radii and fixed-size clusters exaggerate density when users zoom out.
 * Scaling the radius/opacity inversely with zoom keeps heat signatures proportional,
 * while clamping prevents extreme bloom artifacts. All Google Maps objects are
 * instantiated once; zoom listeners update their properties via refs + rAF to avoid
 * unnecessary React re-renders.
 */

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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
const HEATMAP_RADIUS_MIN = 15
const HEATMAP_RADIUS_MAX = 50
const HEATMAP_OPACITY_BASE = 0.4
const HEATMAP_OPACITY_MAX = 0.85
const ZOOM_BASELINE = 14
const DENSITY_DISABLE_ZOOM = 6
const CLUSTER_DETAIL_ZOOM = 12

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
  const zoomRef = useRef<number>(5)
  const zoomRafRef = useRef<number | null>(null)
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const densityModeRef = useRef<'clusters' | 'markers'>('clusters')
  const googleMapsRef = useRef<typeof google | null>(null)

  const applyMarkerIcon = useCallback((marker: google.maps.Marker, severity: Severity, zoom: number) => {
    const googleMaps = googleMapsRef.current
    if (!googleMaps) return
    const color = SEVERITY_COLOR_MAP[severity] ?? '#94a3b8'
    const isCritical = severity === 'CRITICAL'
    const zoomFactor = clamp((zoom || ZOOM_BASELINE) / ZOOM_BASELINE, 0.7, 1.4)
    const baseScale = isCritical ? 9 : 7
    const scale = clamp(baseScale * zoomFactor, isCritical ? 8 : 5, isCritical ? 18 : 11)
    const lowZoom = zoom < 8

    const icon: google.maps.Symbol = {
      path: googleMaps.maps.SymbolPath.CIRCLE,
      scale,
      fillColor: color,
      fillOpacity: isCritical && lowZoom ? 0.8 : 0.95,
      strokeColor: isCritical ? '#fde68a' : '#0f172a',
      strokeOpacity: isCritical && lowZoom ? 0.35 : 0.85,
      strokeWeight: isCritical ? (lowZoom ? 1.2 : 2.4) : 1.2,
    }

    marker.setIcon(icon)
  }, [])

  const syncDensityMode = useCallback((zoom: number) => {
    if (!map || !clusterRef.current) return
    const preferIndividualMarkers = zoom > CLUSTER_DETAIL_ZOOM

    if (preferIndividualMarkers && densityModeRef.current !== 'markers') {
      densityModeRef.current = 'markers'
      clusterRef.current.setMap(null)
      markersRef.current.forEach(marker => marker.setMap(map))
    } else if (!preferIndividualMarkers && densityModeRef.current !== 'clusters') {
      densityModeRef.current = 'clusters'
      markersRef.current.forEach(marker => marker.setMap(null))
      clusterRef.current.setMap(map)
      clusterRef.current.render()
    }
  }, [map])

  const handleZoomUpdate = useCallback(() => {
    if (!map) return
    const googleMaps = googleMapsRef.current
    if (!googleMaps) return
    const zoom = map.getZoom() ?? zoomRef.current
    zoomRef.current = zoom

    markersRef.current.forEach((marker) => {
      const meta = marker.get('incidentMeta') as { severity: Severity } | undefined
      if (!meta) return
      applyMarkerIcon(marker, meta.severity, zoom)

      if (meta.severity === 'CRITICAL') {
        if (zoom < 10) {
          marker.setAnimation(null)
        } else if (!marker.get('isZoomBouncing')) {
          marker.set('isZoomBouncing', true)
          marker.setAnimation(googleMaps.maps.Animation.BOUNCE)
          const timeout = window.setTimeout(() => {
            marker.setAnimation(null)
            marker.set('isZoomBouncing', false)
          }, 2200)
          animationTimersRef.current.push(timeout)
        }
      }
    })

    syncDensityMode(zoom)
  }, [applyMarkerIcon, map, syncDensityMode])

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps) {
      return
    }

    googleMapsRef.current = googleMaps
    const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    animationTimersRef.current.forEach(timer => window.clearTimeout(timer))
    animationTimersRef.current = []

    if (!incidents.length) {
      clusterRef.current?.clearMarkers()
      return
    }

    const zoom = map.getZoom() ?? zoomRef.current
    zoomRef.current = zoom

    markersRef.current = incidents.map((incident) => {
      const marker = new googleMaps.maps.Marker({
        position: incident.coordinates,
        title: incident.title,
        icon: undefined,
        zIndex: incident.severity === 'CRITICAL' ? 2000 : 1000 - severityOrder.indexOf(incident.severity),
        optimized: true,
      })

      marker.set('incidentMeta', { id: incident.id, severity: incident.severity })
      applyMarkerIcon(marker, incident.severity, zoom)

      marker.addListener('click', () => onMarkerClick(incident.id))

      if (incident.severity === 'CRITICAL' && zoom >= 10) {
        marker.set('isZoomBouncing', true)
        marker.setAnimation(googleMaps.maps.Animation.BOUNCE)
        const timeout = window.setTimeout(() => {
          marker.setAnimation(null)
          marker.set('isZoomBouncing', false)
        }, 2200)
        animationTimersRef.current.push(timeout)
      }

      return marker
    })

    if (!clusterRef.current) {
      clusterRef.current = new MarkerClusterer({
        markers: [],
        map,
        renderer: createClusterRenderer(googleMaps, () => zoomRef.current),
      })
    }

    clusterRef.current.clearMarkers()
    clusterRef.current.addMarkers(markersRef.current)
    syncDensityMode(zoom)

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
      animationTimersRef.current.forEach(timer => window.clearTimeout(timer))
      animationTimersRef.current = []
    }
  }, [applyMarkerIcon, incidents, map, onMarkerClick, syncDensityMode])

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps) return

    const listener = googleMaps.maps.event.addListener(map, 'zoom_changed', () => {
      if (zoomRafRef.current) {
        cancelAnimationFrame(zoomRafRef.current)
      }
      zoomRafRef.current = window.requestAnimationFrame(() => {
        handleZoomUpdate()
      })
    })

    zoomListenerRef.current = listener
    handleZoomUpdate()

    return () => {
      listener.remove()
      if (zoomRafRef.current) {
        cancelAnimationFrame(zoomRafRef.current)
        zoomRafRef.current = null
      }
    }
  }, [handleZoomUpdate, map])

  useEffect(() => {
    return () => {
      zoomListenerRef.current?.remove()
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
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const zoomRafRef = useRef<number | null>(null)
  const hasHeatPoints = points.length > 0

  const updateHeatmapAppearance = useCallback((zoom: number) => {
    if (!map || !heatmapRef.current) return
    const normalizedZoom = zoom || ZOOM_BASELINE
    const dynamicRadius = clamp(
      HEATMAP_RADIUS * (ZOOM_BASELINE / Math.max(normalizedZoom, 1)),
      HEATMAP_RADIUS_MIN,
      HEATMAP_RADIUS_MAX,
    )
    const opacity = clamp(HEATMAP_OPACITY_BASE + normalizedZoom / 25, HEATMAP_OPACITY_BASE, HEATMAP_OPACITY_MAX)
    heatmapRef.current.set('radius', dynamicRadius)
    heatmapRef.current.set('opacity', opacity)

    const shouldRender = Boolean(showHeatmap && hasHeatPoints && normalizedZoom >= DENSITY_DISABLE_ZOOM)
    heatmapRef.current.setMap(shouldRender ? map : null)
  }, [hasHeatPoints, map, showHeatmap])

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps || !googleMaps.maps?.visualization) {
      return
    }

    if (!heatmapRef.current) {
      heatmapRef.current = new googleMaps.maps.visualization.HeatmapLayer({
        radius: HEATMAP_RADIUS,
        opacity: HEATMAP_OPACITY_BASE,
        gradient: HEATMAP_GRADIENT,
      })
    }

    const weightedLocations = points.map(point => ({
      location: new googleMaps.maps.LatLng(point.lat, point.lng),
      weight: point.weight,
    }))

    const heatmap = heatmapRef.current
    if (weightedLocations.length) {
      heatmap.setData(weightedLocations)
    } else {
      heatmap.setData([])
    }

    const currentZoom = map.getZoom() ?? ZOOM_BASELINE
    updateHeatmapAppearance(currentZoom)

    return () => {
      if (!showHeatmap) {
        heatmap.setMap(null)
      }
    }
  }, [hasHeatPoints, map, points, showHeatmap, updateHeatmapAppearance])

  useEffect(() => {
    const googleMaps = (window as typeof window & { google?: typeof google }).google
    if (!map || !googleMaps) {
      return
    }

    const listener = googleMaps.maps.event.addListener(map, 'zoom_changed', () => {
      if (zoomRafRef.current) {
        cancelAnimationFrame(zoomRafRef.current)
      }
      zoomRafRef.current = window.requestAnimationFrame(() => {
        const zoom = map.getZoom() ?? ZOOM_BASELINE
        updateHeatmapAppearance(zoom)
      })
    })

    zoomListenerRef.current = listener
    updateHeatmapAppearance(map.getZoom() ?? ZOOM_BASELINE)

    return () => {
      listener.remove()
      if (zoomRafRef.current) {
        cancelAnimationFrame(zoomRafRef.current)
        zoomRafRef.current = null
      }
    }
  }, [map, updateHeatmapAppearance])

  useEffect(() => {
    return () => {
      zoomListenerRef.current?.remove()
      heatmapRef.current?.setMap(null)
      heatmapRef.current = null
    }
  }, [])

  return null
}

function createClusterRenderer(googleMaps: typeof google, getZoom: () => number): MarkerClustererOptions['renderer'] {
  return {
    render: ({ count, position }) => {
      const safeCount = count || 1
      const zoom = getZoom() || ZOOM_BASELINE
      const baseSize = clamp(30 + Math.log(safeCount) * 12, 28, 70)
      const zoomScale = clamp(zoom / ZOOM_BASELINE, 0.6, 1.8)
      const size = clamp(baseSize * zoomScale, 24, 90)
      const fontSize = clamp(size * 0.4, 12, 32)
      const color = safeCount < 5 ? '#22c55e' : safeCount <= 10 ? '#f97316' : '#ef4444'
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}" flood-opacity="0.35" />
            </filter>
          </defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" filter="url(#shadow)" />
          <text x="50%" y="52%" text-anchor="middle" font-family="'Inter', sans-serif" font-size="${fontSize}" font-weight="700" fill="#0f172a">${safeCount}</text>
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
