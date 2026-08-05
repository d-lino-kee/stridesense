// Sample running routes around the University of Waterloo / Waterloo Region.
// Coordinates are real waypoints; the map tracer snaps a walking path between
// them, and `elevation` drives the 2.5D profile + 3D terrain view.

export type LatLng = { lat: number; lng: number }

export type WaterlooRoute = {
  id: number
  slug: string
  name: string
  area: string
  blurb: string
  distanceKm: number
  elevationM: number // total gain
  minutes: number
  score: number // 0–10 suitability
  soreness: number // 0–10 predicted
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Epic'
  tag: string
  surface: string
  accent: string
  waypoints: LatLng[]
  /** Absolute elevation samples (metres ASL) along the route, start → finish. */
  elevation: number[]
}

// University of Waterloo (Ring Road centre).
export const UW_ORIGIN: LatLng = { lat: 43.4723, lng: -80.5449 }

export const WATERLOO_ROUTES: WaterlooRoute[] = [
  {
    id: 1,
    slug: 'ring-road-loop',
    name: 'Ring Road Loop',
    area: 'UW Campus',
    blurb:
      'A flat, well-lit lap of campus on Ring Road — ideal for an easy shakeout between classes.',
    distanceKm: 3.4,
    elevationM: 22,
    minutes: 19,
    score: 9.4,
    soreness: 2,
    difficulty: 'Easy',
    tag: 'Recovery',
    surface: 'Paved path',
    accent: '#10b981',
    waypoints: [
      { lat: 43.4723, lng: -80.5449 },
      { lat: 43.4756, lng: -80.5432 },
      { lat: 43.4759, lng: -80.5386 },
      { lat: 43.472, lng: -80.5372 },
      { lat: 43.4693, lng: -80.5403 },
      { lat: 43.4701, lng: -80.5451 },
      { lat: 43.4723, lng: -80.5449 },
    ],
    elevation: [334, 335, 336, 337, 336, 335, 334, 333, 334, 335, 334, 334],
  },
  {
    id: 2,
    slug: 'waterloo-park-loop',
    name: 'Waterloo Park Loop',
    area: 'Waterloo Park',
    blurb:
      'Rolling paths past the lake, animals and gardens — soft scenery and gentle undulation.',
    distanceKm: 4.6,
    elevationM: 48,
    minutes: 26,
    score: 8.9,
    soreness: 3,
    difficulty: 'Easy',
    tag: 'Scenic',
    surface: 'Mixed path',
    accent: '#0ea5e9',
    waypoints: [
      { lat: 43.4723, lng: -80.5449 },
      { lat: 43.4699, lng: -80.5372 },
      { lat: 43.4671, lng: -80.5331 },
      { lat: 43.4651, lng: -80.5296 },
      { lat: 43.4668, lng: -80.5268 },
      { lat: 43.4689, lng: -80.5312 },
      { lat: 43.4715, lng: -80.5401 },
      { lat: 43.4723, lng: -80.5449 },
    ],
    elevation: [334, 336, 338, 335, 331, 329, 332, 336, 339, 337, 335, 334],
  },
  {
    id: 3,
    slug: 'laurel-creek-trail',
    name: 'Laurel Creek Trail',
    area: 'Laurel Creek C.A.',
    blurb:
      'A rolling reservoir loop on crushed-gravel trail — the region’s go-to for a true off-road feel.',
    distanceKm: 6.8,
    elevationM: 96,
    minutes: 41,
    score: 8.3,
    soreness: 5,
    difficulty: 'Moderate',
    tag: 'Trail',
    surface: 'Gravel trail',
    accent: '#8b5cf6',
    waypoints: [
      { lat: 43.4723, lng: -80.5449 },
      { lat: 43.4761, lng: -80.5508 },
      { lat: 43.4802, lng: -80.558 },
      { lat: 43.4841, lng: -80.5629 },
      { lat: 43.4869, lng: -80.5567 },
      { lat: 43.4828, lng: -80.5501 },
      { lat: 43.4776, lng: -80.5462 },
      { lat: 43.4723, lng: -80.5449 },
    ],
    elevation: [334, 340, 347, 355, 361, 352, 344, 349, 341, 336, 335, 334],
  },
  {
    id: 4,
    slug: 'iron-horse-trail',
    name: 'Iron Horse Trail',
    area: 'Uptown → Kitchener',
    blurb:
      'A flat, dead-straight rail-trail linking Uptown Waterloo to Kitchener — perfect for tempo.',
    distanceKm: 7.2,
    elevationM: 34,
    minutes: 39,
    score: 8.1,
    soreness: 4,
    difficulty: 'Moderate',
    tag: 'Tempo',
    surface: 'Rail trail',
    accent: '#f96316',
    waypoints: [
      { lat: 43.4649, lng: -80.5236 },
      { lat: 43.4592, lng: -80.5158 },
      { lat: 43.4531, lng: -80.5079 },
      { lat: 43.4478, lng: -80.5006 },
      { lat: 43.4432, lng: -80.4938 },
      { lat: 43.4401, lng: -80.489 },
    ],
    elevation: [332, 330, 329, 327, 326, 325, 324, 323, 324, 323, 322, 321],
  },
  {
    id: 5,
    slug: 'columbia-lake-loop',
    name: 'Columbia Lake Loop',
    area: 'North Campus',
    blurb:
      'A short, flat loop around Columbia Lake fields — quiet, open and great for intervals.',
    distanceKm: 3.9,
    elevationM: 28,
    minutes: 22,
    score: 7.8,
    soreness: 3,
    difficulty: 'Easy',
    tag: 'Intervals',
    surface: 'Paved path',
    accent: '#14b8a6',
    waypoints: [
      { lat: 43.4723, lng: -80.5449 },
      { lat: 43.4759, lng: -80.5498 },
      { lat: 43.4792, lng: -80.5546 },
      { lat: 43.4808, lng: -80.5495 },
      { lat: 43.4778, lng: -80.5451 },
      { lat: 43.4746, lng: -80.5442 },
      { lat: 43.4723, lng: -80.5449 },
    ],
    elevation: [334, 335, 337, 336, 335, 334, 335, 334, 333, 334, 334, 334],
  },
  {
    id: 6,
    slug: 'grand-river-rim-park',
    name: 'Grand River · RIM Park',
    area: 'RIM Park',
    blurb:
      'A longer riverside adventure with a valley descent and climb-out — real marathon-prep terrain.',
    distanceKm: 12.4,
    elevationM: 168,
    minutes: 74,
    score: 7.5,
    soreness: 7,
    difficulty: 'Hard',
    tag: 'Long run',
    surface: 'Mixed trail',
    accent: '#f43f5e',
    waypoints: [
      { lat: 43.4723, lng: -80.5449 },
      { lat: 43.4818, lng: -80.5261 },
      { lat: 43.4921, lng: -80.5058 },
      { lat: 43.5031, lng: -80.4859 },
      { lat: 43.5079, lng: -80.4781 },
      { lat: 43.5012, lng: -80.4903 },
      { lat: 43.4894, lng: -80.5121 },
      { lat: 43.4791, lng: -80.5324 },
      { lat: 43.4723, lng: -80.5449 },
    ],
    elevation: [334, 340, 331, 318, 305, 312, 326, 321, 333, 342, 338, 334],
  },
]

export function routeBySlug(slug: string): WaterlooRoute | undefined {
  return WATERLOO_ROUTES.find((r) => r.slug === slug)
}

export function routeById(id: number): WaterlooRoute | undefined {
  return WATERLOO_ROUTES.find((r) => r.id === id)
}

/**
 * Build a keyless Google Maps *directions* embed that traces the actual walking
 * path through every waypoint — this is the on-map route "tracer".
 */
export function tracerEmbedFromWaypoints(pts: LatLng[]): string {
  const saddr = `${pts[0].lat},${pts[0].lng}`
  const rest = pts.slice(1)
  const daddr = rest
    .map((p, i) => (i === 0 ? `${p.lat},${p.lng}` : `+to:${p.lat},${p.lng}`))
    .join('')
  // dirflg=w → walking directions; output=embed → keyless interactive map.
  return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=w&output=embed`
}

export function tracerEmbedUrl(route: WaterlooRoute): string {
  return tracerEmbedFromWaypoints(route.waypoints)
}

/**
 * A Google Maps *directions* deep link (turn-by-turn walking directions through
 * the route's waypoints) that opens in a new tab / the Maps app.
 */
export function directionsUrl(pts: LatLng[]): string {
  const origin = `${pts[0].lat},${pts[0].lng}`
  const destination = `${pts[pts.length - 1].lat},${pts[pts.length - 1].lng}`
  const mids = pts.slice(1, -1).slice(0, 9) // Maps allows up to ~9 waypoints
  const wp = mids.map((p) => `${p.lat},${p.lng}`).join('|')
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'walking',
  })
  if (wp) params.set('waypoints', wp)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Single-pin embed centred on the route start. */
export function pinEmbedUrl(route: WaterlooRoute): string {
  const p = route.waypoints[0]
  return `https://maps.google.com/maps?q=${p.lat},${p.lng}(${encodeURIComponent(
    route.name,
  )})&z=14&output=embed`
}

/** Derived terrain stats for the elevation/terrain views. */
export function terrainStats(route: WaterlooRoute) {
  const el = route.elevation
  const min = Math.min(...el)
  const max = Math.max(...el)
  let gain = 0
  let maxGrade = 0
  const stepM = (route.distanceKm * 1000) / (el.length - 1)
  for (let i = 1; i < el.length; i++) {
    const d = el[i] - el[i - 1]
    if (d > 0) gain += d
    maxGrade = Math.max(maxGrade, Math.abs(d) / stepM)
  }
  return {
    min,
    max,
    relief: max - min,
    gain: Math.round(gain),
    maxGradePct: Math.round(maxGrade * 100),
  }
}
