'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/api-client'
import type { RouteItem } from '@/types'

export default function RoutesPanel() {
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<{ items: RouteItem[] }>('/routes')
      .then((res) => {
        if (!cancelled) setRoutes(res.items ?? [])
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load routes'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold text-ink">Saved routes</h2>
      <p className="text-xs text-ink-muted">Candidates the model ranks for you</p>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {!loading && !error && routes.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-ink-muted">
          No saved routes yet.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {routes.map((r) => (
          <li
            key={r.route_id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="font-semibold text-ink">{r.name}</span>
            <span className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="chip bg-white text-ink-soft">{r.distance_km.toFixed(1)} km</span>
              <span className="chip bg-white text-ink-soft">+{Math.round(r.elevation_gain)} m</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
