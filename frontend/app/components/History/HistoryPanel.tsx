'use client'

import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

function sorenessColor(level: number) {
  if (level >= 7) return 'bg-red-100 text-red-700'
  if (level >= 4) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

export default function HistoryPanel() {
  const runs = useSelector((s: RootState) => s.runs.recent)
  const loading = useSelector((s: RootState) => s.runs.loading)

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Recent runs</h2>
          <p className="text-xs text-ink-muted">Your latest logged activity</p>
        </div>
        {runs.length > 0 && (
          <span className="chip bg-slate-100 text-ink-soft">{runs.length} runs</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-ink-muted">
          No runs yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {runs.map((r, i) => (
            <li key={r.run_id ?? i} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {new Date(r.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-ink-muted">
                  {r.distance_km.toFixed(1)} km · {(60 / Math.max(r.avg_speed, 0.1)).toFixed(1)} min/km
                  · +{Math.round(r.avg_elevation)} m
                </p>
              </div>
              <span className={`chip ${sorenessColor(r.soreness_level)}`}>
                soreness {r.soreness_level}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
