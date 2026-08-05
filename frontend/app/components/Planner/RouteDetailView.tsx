'use client'

import { useMemo } from 'react'
import SpectrumBar from '@/components/ui/SpectrumBar'
import TerrainView from '@/components/Terrain/TerrainView'
import RouteSummary from '@/components/RouteIntel/RouteSummary'
import ReviewsPanel from '@/components/RouteIntel/ReviewsPanel'
import { tracerEmbedFromWaypoints, terrainStats, directionsUrl, type WaterlooRoute } from '@/data/waterlooRoutes'

function fmtTime(min: number) {
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

export default function RouteDetailView({ route }: { route: WaterlooRoute }) {
  const mapSrc = useMemo(() => tracerEmbedFromWaypoints(route.waypoints), [route])
  const stats = terrainStats(route)

  const facts = [
    { label: 'Distance', value: `${route.distanceKm.toFixed(1)} km` },
    { label: 'Time', value: fmtTime(route.minutes) },
    { label: 'Climb', value: `+${route.elevationM} m` },
    { label: 'Max grade', value: `${stats.maxGradePct}%` },
    { label: 'Difficulty', value: route.difficulty },
    { label: 'Surface', value: route.surface },
  ]

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-slate-200/70 p-6 shadow-card sm:p-8"
        style={{ background: `linear-gradient(135deg, ${route.accent}1f, #ffffff 65%)` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-20 blur-3xl animate-float" style={{ background: route.accent }} />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ background: `${route.accent}1f`, color: route.accent }}>
              {route.tag} · {route.area}
            </span>
            <a
              href={directionsUrl(route.waypoints)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M3 11l19-9-9 19-2-8-8-2z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
              Get directions
            </a>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{route.name}</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">{route.blurb}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2.5 text-center backdrop-blur">
                <div className="text-sm font-bold text-ink">{f.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-ink-muted">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spectrums */}
      <div className="grid gap-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:grid-cols-2">
        <SpectrumBar kind="suitability" value={route.score} />
        <SpectrumBar kind="soreness" value={route.soreness} />
      </div>

      {/* Map + terrain */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-bold text-ink">Route tracer</h3>
            <p className="text-[11px] text-ink-muted">The exact path on Google Maps</p>
          </div>
          <div className="relative h-[380px] bg-slate-100">
            <iframe
              key={mapSrc}
              title={`Route tracer — ${route.name}`}
              src={mapSrc}
              loading="lazy"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
        <TerrainView route={route} />
      </div>

      {/* Summary + reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RouteSummary route={route} />
        <ReviewsPanel slug={route.slug} />
      </div>
    </div>
  )
}
