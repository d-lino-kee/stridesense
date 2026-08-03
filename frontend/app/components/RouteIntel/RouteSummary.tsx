'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/api-client'
import type { WaterlooRoute } from '@/data/waterlooRoutes'

type SummaryResult = {
  summary: string
  source: 'openai' | 'heuristic'
}
type JobState = {
  job_id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  result?: SummaryResult | null
  node_id?: string
  cached?: boolean
}

export default function RouteSummary({ route }: { route: WaterlooRoute }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('loading')
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [meta, setMeta] = useState<{ node?: string; cached?: boolean }>({})
  const [typed, setTyped] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setResult(null)
    setTyped('')

    async function run() {
      try {
        const submit = await apiFetch<JobState>('/route-intel/summary', {
          method: 'POST',
          body: JSON.stringify({
            slug: route.slug,
            name: route.name,
            distance_km: route.distanceKm,
            surface: route.surface,
            tag: route.tag,
            elevation: route.elevation,
          }),
        })

        if (submit.status === 'done' && submit.result) {
          if (!cancelled) {
            setResult(submit.result)
            setMeta({ node: submit.node_id, cached: submit.cached })
            setState('done')
          }
          return
        }

        // Poll the async job until a worker finishes it.
        const jobId = submit.job_id
        for (let i = 0; i < 40 && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 500))
          const s = await apiFetch<JobState>(`/route-intel/summary/${jobId}`)
          if (s.status === 'done' && s.result) {
            if (!cancelled) {
              setResult(s.result)
              setMeta({ node: s.node_id, cached: s.cached })
              setState('done')
            }
            return
          }
          if (s.status === 'failed') break
        }
        if (!cancelled) setState('error')
      } catch {
        if (!cancelled) setState('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [route])

  // Typewriter reveal.
  useEffect(() => {
    if (state !== 'done' || !result) return
    const text = result.summary
    let i = 0
    const tick = () => {
      i += 2
      setTyped(text.slice(0, i))
      if (i < text.length) timer.current = setTimeout(tick, 12)
    }
    tick()
    return () => clearTimeout(timer.current)
  }, [state, result])

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-gradient opacity-10 blur-2xl" />
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5 10.1 10.9 5.5 9l4.6-1.4L12 3z" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h3 className="text-base font-bold text-ink">AI route preview</h3>
          <p className="text-xs text-ink-muted">What it looks like · what you&apos;ll feel</p>
        </div>
      </div>

      {state === 'loading' && (
        <div className="space-y-2.5">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-600">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
            Generating your route preview…
          </p>
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-4/5" />
        </div>
      )}

      {state === 'error' && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Couldn&apos;t reach the route-intelligence service. Make sure the API is running.
        </p>
      )}

      {state === 'done' && result && (
        <>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            {typed}
            {typed.length < result.summary.length && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand-400 align-middle" />
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              {result.source === 'openai' ? '✦ GPT-generated' : '✦ StrideSense engine'}
            </span>
            {meta.cached && (
              <span className="chip bg-emerald-50 text-emerald-700">served from cache</span>
            )}
            {meta.node && (
              <span className="chip bg-slate-100 text-ink-muted" title="Worker node that generated this">
                node {meta.node.split('-').slice(-1)[0]}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
