export type RunType = 'jog'|'light'|'mid'|'marathon'
export interface RunRecord { date: string; distance: number; pace: number; elev: number; soreness: number; run_type: RunType}
export interface RouteItem { route_id: number; name: string; distance_km; number; elevation_gain; number }
export interface RecommendationInput { feeling: RunType; rushed: boolean; day_of_week: number; season: 'winter'|'spring'|'summer'|'fall'; pref_elevation: 'flat'|'up'|'down'; adventure_level?: number; time_available_min?: number }
export interface RecommendationResult { route: RouteItem & { type?: RunType }; predicted_soreness: number; rationale: string }