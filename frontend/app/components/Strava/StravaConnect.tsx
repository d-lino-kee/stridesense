'use client'

import { useState } from 'react'
import { apiFetch } from '@/api-client'
import type { StravaStartResponse } from '@/types'

export default function StravaConnect() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await apiFetch<StravaStartResponse>('/oauth/strava/start')
      window.location.href = url
    } catch (e) {
      setError(
        e instanceof Error
          ? 'Strava isn’t configured on the API yet — add STRAVA_CLIENT_ID to enable import.'
          : 'Failed to start Strava auth',
      )
      setLoading(false)
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
          Connect your Strava account and StrideSense will sync recent runs to sharpen your
          recommendations.
        </p>
        <button type="button" onClick={connect} disabled={loading} className="btn-primary mt-4 w-full py-2.5">
          {loading ? 'Redirecting…' : 'Connect Strava'}
        </button>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </section>
  )
}
