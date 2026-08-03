'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { apiFetch } from '@/api-client'
import { setRuns } from '@/store/slices/runsSlice'
import type { StravaStartResponse, RunRecord } from '@/types'

export default function StravaConnect() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function connect() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await apiFetch<StravaStartResponse>('/oauth/strava/start')
      window.location.href = url
    } catch {
      setError(
        'Strava’s API needs a subscription to connect directly — use the demo import below to test the flow.',
      )
      setLoading(false)
    }
  }

  async function demoImport() {
    setImporting(true)
    setError(null)
    setMsg(null)
    try {
      const res = await apiFetch<{ imported: number }>('/oauth/strava/demo', { method: 'POST' })
      // Refresh the store so charts + history update immediately.
      const runs = await apiFetch<{ items: RunRecord[] }>('/runs?limit=30')
      dispatch(setRuns(runs.items ?? []))
      setMsg(`Imported ${res.imported} activities and retrained your model 🎉`)
    } catch {
      setError('Could not run the demo import. Is the API running?')
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="bg-brand-gradient p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8 2l4.5 9H9.5L8 8 6.5 11H3.5L8 2zm5 11h3l2.5 5-2.5 5-2.5-5 1.25-2.5H13z" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-bold">Import from Strava</h2>
            <p className="text-xs text-white/80">Pull your run history to personalize scores</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-ink-soft">
          Connect your Strava account to sync recent runs. Strava’s API is subscriber-gated, so if
          you can’t connect directly, load a batch of sample activities to test the full experience.
        </p>

        <button
          type="button"
          onClick={connect}
          disabled={loading}
          className="btn-primary mt-4 w-full py-2.5"
        >
          {loading ? 'Redirecting…' : 'Connect Strava'}
        </button>

        <button
          type="button"
          onClick={demoImport}
          disabled={importing}
          className="btn-ghost mt-2 w-full py-2.5"
        >
          {importing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
              Importing…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Import demo activities
            </>
          )}
        </button>

        {msg && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{msg}</p>}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </section>
  )
}
