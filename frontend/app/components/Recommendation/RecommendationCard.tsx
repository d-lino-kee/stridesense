'use client'

import type { RecommendationResult } from '@/types'

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) / 10
  const deg = Math.round(pct * 360)
  return (
    <div
      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#f96316 ${deg}deg, #f1f5f9 ${deg}deg)` }}
    >
      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white">
        <span className="text-sm font-bold leading-none text-ink">{score.toFixed(1)}</span>
        <span className="text-[9px] uppercase tracking-wide text-ink-muted">/ 10</span>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-sm font-bold text-ink">{value}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  )
}

export default function RecommendationCard({ result }: { result: RecommendationResult }) {
  const { route, predicted_soreness, suitability_score, rationale } = result
  return (
    <div className="animate-fade-up rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={suitability_score} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-ink">{route.name}</h3>
            {route.type && (
              <span className="chip bg-white text-brand-700 ring-1 ring-brand-100">{route.type}</span>
            )}
          </div>
          <p className="text-xs text-ink-muted">Recommended for you today</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat value={`${route.distance_km.toFixed(1)} km`} label="distance" />
        <Stat value={`+${Math.round(route.elevation_gain)} m`} label="elevation" />
        <Stat value={`${predicted_soreness}/10`} label="predicted soreness" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{rationale}</p>
    </div>
  )
}
