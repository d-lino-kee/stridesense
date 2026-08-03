'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  WATERLOO_ROUTES,
  tracerEmbedUrl,
  terrainStats,
  type WaterlooRoute,
} from '@/data/waterlooRoutes'

function fmtTime(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function StarRow({ score }: { score: number }) {
  const filled = Math.round(score / 2)
  return (
    <span className="flex items-center gap-0.5" aria-label={`${score} out of 10`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z"
            fill={i < filled ? '#f59e0b' : '#e2e8f0'}
          />
        </svg>
      ))}
    </span>
  )
}

export default function RouteMapPanel() {
  const [selectedId, setSelectedId] = useState(WATERLOO_ROUTES[0].id)
  const active: WaterlooRoute =
    WATERLOO_ROUTES.find((r) => r.id === selectedId) ?? WATERLOO_ROUTES[0]

  // Keyless Google Maps *directions* embed traces the walking path through every waypoint.
  const mapSrc = useMemo(() => tracerEmbedUrl(active), [active])
  const stats = useMemo(() => terrainStats(active), [active])

  return (
    <section className="card-glass overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" strokeWidth="1.6" />
              <circle cx="12" cy="11" r="2.2" strokeWidth="1.6" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Runs around Waterloo</h2>
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Traced from the University of Waterloo
            </p>
          </div>
        </div>
        <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          {WATERLOO_ROUTES.length} routes nearby
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        {/* Map with route tracer */}
        <div className="relative min-h-[380px] bg-slate-100">
          <iframe
            key={mapSrc}
            title={`Route tracer — ${active.name}`}
            src={mapSrc}
            loading="lazy"
            className="absolute inset-0 h-full w-full animate-fade-up"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Floating route badge */}
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-3 py-2 shadow-lift backdrop-blur">
            <span className="relative flex h-3 w-3">
              <span
                className="absolute inline-flex h-full w-full animate-ping-slow rounded-full"
                style={{ background: active.accent }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full ring-2 ring-white"
                style={{ background: active.accent }}
              />
            </span>
            <span className="text-sm font-bold text-ink">{active.name}</span>
            <span className="text-[11px] font-medium text-ink-muted">· {active.area}</span>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
            <span className="chip bg-white/90 text-ink-soft shadow-card backdrop-blur">
              {active.distanceKm.toFixed(1)} km
            </span>
            <span className="chip bg-white/90 text-ink-soft shadow-card backdrop-blur">
              +{active.elevationM} m
            </span>
            <span className="chip bg-white/90 text-ink-soft shadow-card backdrop-blur">
              {fmtTime(active.minutes)}
            </span>
            <span className="chip bg-white/90 text-ink-soft shadow-card backdrop-blur">
              ⛰ {stats.maxGradePct}% max
            </span>
          </div>
        </div>

        {/* Recommendation list */}
        <div className="max-h-[480px] space-y-2.5 overflow-y-auto scrollbar-slim p-4 sm:p-5">
          {WATERLOO_ROUTES.map((r, i) => {
            const isActive = r.id === selectedId
            return (
              <div
                key={r.id}
                style={{
                  animationDelay: `${i * 55}ms`,
                  ...(isActive
                    ? { boxShadow: `0 0 0 2px ${r.accent}80, 0 20px 50px -20px rgba(15,23,42,0.35)` }
                    : {}),
                }}
                className={`group animate-pop-in rounded-2xl border p-4 transition-all duration-200 ${
                  isActive
                    ? 'border-transparent bg-white'
                    : 'border-slate-200/70 bg-white/60 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                      style={{ background: r.accent }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-bold text-ink">{r.name}</h3>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: `${r.accent}1a`, color: r.accent }}
                        >
                          {r.tag}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted group-hover:line-clamp-none">
                        {r.blurb}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${r.score * 10}%`, background: r.accent }}
                          />
                        </div>
                        <span className="text-xs font-bold text-ink">{r.score.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                        <span className="font-semibold text-ink-soft">{r.distanceKm.toFixed(1)} km</span>
                        <span>+{r.elevationM} m</span>
                        <span>{fmtTime(r.minutes)}</span>
                        <span
                          className="rounded px-1.5 py-0.5 font-medium"
                          style={{ background: `${r.accent}14`, color: r.accent }}
                        >
                          {r.difficulty}
                        </span>
                        <StarRow score={r.score} />
                      </div>
                    </div>
                  </div>
                </button>

                {isActive && (
                  <Link
                    href={`/routes/${r.slug}`}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-xs font-bold text-white shadow-glow transition hover:brightness-105"
                  >
                    View route · 3D terrain · reviews
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
