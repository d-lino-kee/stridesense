'use client'

import { useCallback, useEffect, useState } from 'react'
import { API_BASE } from '@/api-client'

/**
 * Pings the API and shows a clear banner if it's unreachable, so a down/misconfigured
 * backend surfaces plainly instead of as a bare "Failed to fetch" on some button.
 */
export default function ApiStatusBanner() {
  const [down, setDown] = useState(false)
  const [checking, setChecking] = useState(false)

  const check = useCallback(async () => {
    setChecking(true)
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 5000)
      const res = await fetch(`${API_BASE}/`, { signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(t)
      setDown(!res.ok)
    } catch {
      setDown(true)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, 20000)
    return () => clearInterval(id)
  }, [check])

  if (!down) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white/95 p-4 shadow-lift backdrop-blur">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <path d="M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Can&apos;t reach the StrideSense API</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            No response from <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">{API_BASE}</code>. Make sure the backend is running.
          </p>
        </div>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"
        >
          {checking ? 'Checking…' : 'Retry'}
        </button>
      </div>
    </div>
  )
}
