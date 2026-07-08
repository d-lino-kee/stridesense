'use client'

import { useState } from 'react'
import RecommendationForm from './RecommendationForm'
import RecommendationCard from './RecommendationCard'
import { apiFetch } from '@/api-client'
import type { RecommendationInput, RecommendationResult } from '@/types'

export default function RecommendationPanel() {
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: RecommendationInput) {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<RecommendationResult>('/recommend', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch recommendation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <path
              d="M13 2L4.5 12.5H11l-1 9.5 9.5-13H13l0-7z"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Recommended run</h2>
          <p className="text-xs text-ink-muted">Tuned to how you feel and your recent activity</p>
        </div>
      </div>

      <RecommendationForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {result && (
        <div className="mt-5">
          <RecommendationCard result={result} />
        </div>
      )}
    </section>
  )
}
