'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TerrainView from '@/components/Terrain/TerrainView'
import RouteSummary from '@/components/RouteIntel/RouteSummary'
import ReviewsPanel from '@/components/RouteIntel/ReviewsPanel'
import { routeBySlug, tracerEmbedUrl, terrainStats } from '@/data/waterlooRoutes'

function fmtTime(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function RouteDetail({ params }: { params: { slug: string } }) {
  const route = routeBySlug(params.slug)
  if (!route) notFound()

  const mapSrc = useMemo(() => tracerEmbedUrl(route), [route])
  const stats = terrainStats(route)

  const facts = [
    { label: 'Distance', value: `${route.distanceKm.toFixed(1)} km` },
    { label: 'Est. time', value: fmtTime(route.minutes) },
    { label: 'Elevation', value: `+${route.elevationM} m` },
    { label: 'Max grade', value: `${stats.maxGradePct}%` },
    { label: 'Difficulty', value: route.difficulty },
    { label: 'Surface', value: route.surface },
  ]

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
          <path d="M19 12H5M11 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to dashboard
      </Link>

      {/* Hero */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/70 p-6 shadow-card sm:p-8"
        style={{ background: `linear-gradient(135deg, ${route.accent}14, #ffffff 60%)` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-20 blur-3xl animate-float"
             style={{ background: route.accent }} />
        <div className="relative">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
            style={{ background: `${route.accent}1f`, color: route.accent }}
          >
            {route.tag} · {route.area}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{route.name}</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">{route.blurb}</p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2.5 text-center backdrop-blur">
                <div className="text-sm font-bold text-ink">{f.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-ink-muted">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          {/* Map tracer */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-ink">Route tracer</h3>
                <p className="text-xs text-ink-muted">The exact path, traced on Google Maps</p>
              </div>
              <span className="chip bg-slate-100 text-ink-soft">walking route</span>
            </div>
            <div className="relative h-[420px] bg-slate-100">
              <iframe
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

        <div className="grid content-start gap-6">
          <RouteSummary route={route} />
          <ReviewsPanel slug={route.slug} />
        </div>
      </div>
    </div>
  )
}
