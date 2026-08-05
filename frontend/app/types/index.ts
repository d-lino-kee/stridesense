export type RunType = 'jog' | 'light' | 'mid' | 'marathon'
export type Season = 'winter' | 'spring' | 'summer' | 'fall'
export type ElevationPref = 'flat' | 'up' | 'down'

export interface RunRecord {
  run_id?: number
  name?: string | null
  notes?: string | null
  date: string
  day_of_week?: number
  season?: Season
  run_type: RunType
  distance_km: number
  avg_speed: number
  avg_elevation: number
  soreness_level: number
  rushed: boolean
}

export interface RouteItem {
  route_id: number
  name: string
  distance_km: number
  elevation_gain: number
  map_data?: Record<string, unknown> | null
}

export interface RecommendationInput {
  feeling: RunType
  rushed: boolean
  day_of_week: number
  pref_elevation?: ElevationPref
  adventure_level?: number
  time_available_min?: number
  origin_lat?: number
  origin_lng?: number
}

export interface RecommendationResult {
  route: RouteItem & { type?: RunType }
  predicted_soreness: number
  suitability_score: number
  rationale: string
}

export interface ChatReply {
  reply: string
}

export interface StravaStartResponse {
  url: string
}
