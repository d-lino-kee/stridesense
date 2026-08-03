'use client'

import { useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import SpectrumBar from '@/components/ui/SpectrumBar'
import TerrainView from '@/components/Terrain/TerrainView'
import RouteSummary from '@/components/RouteIntel/RouteSummary'
import ReviewsPanel from '@/components/RouteIntel/ReviewsPanel'
import { tracerEmbedFromWaypoints, terrainStats, type WaterlooRoute } from '@/data/waterlooRoutes'

export type PlannerRoute = WaterlooRoute & { id?: number }

function fmtTime(min: number) {
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

export default function RouteModal({
  route,
  open,
  onClose,
}: {
  route: PlannerRoute | null
  open: boolean
  onClose: () => void
}) {
  const mapSrc = useMemo(
    () => (route ? tracerEmbedFromWaypoints(route.waypoints) : ''),
    [route],
  )
  if (!route) return null
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
    <Modal open={open} onClose={onClose} className="max-w-5xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-lift">
        {/* Header */}
        <div
          className="relative overflow-hidden px-6 py-6 sm:px-8"
          style={{ background: `linear-gradient(135deg, ${route.accent}1f, #ffffff 65%)` }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ background: route.accent }}
          />
          <div className="relative">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{ background: `${route.accent}1f`, color: route.accent }}
            >
              {route.tag} · {route.area}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{route.name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">{route.blurb}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {facts.map((f) => (
                <div key={f.label} className="rounded-xl border border-slate-200/70 bg-white/80 px-2 py-2 text-center backdrop-blur">
                  <div className="text-sm font-bold text-ink">{f.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-muted">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto scrollbar-slim p-6 sm:p-8">
          {/* Spectrums */}
          <div className="mb-6 grid gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2">
            <SpectrumBar kind="suitability" value={route.score} />
            <SpectrumBar kind="soreness" value={route.soreness} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Map tracer */}
            <section className="card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-bold text-ink">Route tracer</h3>
                <p className="text-[11px] text-ink-muted">The exact path on Google Maps</p>
              </div>
              <div className="relative h-72 bg-slate-100">
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RouteSummary route={route} />
            <ReviewsPanel slug={route.slug} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
