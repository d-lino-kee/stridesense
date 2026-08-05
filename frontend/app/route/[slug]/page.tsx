'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RouteDetailView from '@/components/Planner/RouteDetailView'
import { routeBySlug, type WaterlooRoute } from '@/data/waterlooRoutes'

export default function RoutePage({ params }: { params: { slug: string } }) {
  const [route, setRoute] = useState<WaterlooRoute | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let found: WaterlooRoute | null = null
    try {
      const raw = sessionStorage.getItem(`route:${params.slug}`)
      if (raw) found = JSON.parse(raw)
    } catch {
      /* ignore */
    }
    if (!found) found = routeBySlug(params.slug) ?? null
    setRoute(found)
    setLoaded(true)
  }, [params.slug])

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-soft shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M19 12H5M11 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to dashboard
      </Link>

      {!loaded ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
        </div>
      ) : route ? (
        <RouteDetailView route={route} />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <span className="text-4xl">🧭</span>
          <p className="mt-3 text-lg font-bold text-ink">Route not found</p>
          <p className="mt-1 text-sm text-ink-muted">Head back and generate your routes again.</p>
          <Link href="/dashboard" className="btn-primary mt-5 inline-flex px-5 py-2.5">Back to dashboard</Link>
        </div>
      )}
    </div>
  )
}
