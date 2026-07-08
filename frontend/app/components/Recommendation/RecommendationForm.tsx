'use client'

import { useState } from 'react'
import type { RecommendationInput, RunType, ElevationPref } from '@/types'

const RUN_TYPES: { value: RunType; label: string }[] = [
  { value: 'jog', label: 'Jog' },
  { value: 'light', label: 'Light' },
  { value: 'mid', label: 'Mid' },
  { value: 'marathon', label: 'Marathon' },
]

const ELEV_PREFS: { value: ElevationPref; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'up', label: 'Uphill' },
  { value: 'down', label: 'Downhill' },
]

export default function RecommendationForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: RecommendationInput) => void
  loading: boolean
}) {
  const [form, setForm] = useState<RecommendationInput>({
    feeling: 'jog',
    rushed: false,
    day_of_week: new Date().getDay(),
    pref_elevation: 'flat',
    adventure_level: 0.3,
  })

  function update<K extends keyof RecommendationInput>(key: K, value: RecommendationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <div>
        <span className="field-label">How do you feel today?</span>
        <div className="grid grid-cols-4 gap-2">
          {RUN_TYPES.map((rt) => {
            const active = form.feeling === rt.value
            return (
              <button
                type="button"
                key={rt.value}
                onClick={() => update('feeling', rt.value)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300'
                }`}
              >
                {rt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="field-label">Elevation preference</span>
        <div className="grid grid-cols-3 gap-2">
          {ELEV_PREFS.map((ep) => {
            const active = form.pref_elevation === ep.value
            return (
              <button
                type="button"
                key={ep.value}
                onClick={() => update('pref_elevation', ep.value)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300'
                }`}
              >
                {ep.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className="field-label">Time available (min)</span>
          <input
            type="number"
            min={0}
            placeholder="Optional"
            className="field-control"
            onChange={(e) =>
              update('time_available_min', e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </label>
        <div>
          <span className="field-label">
            Adventure · {Math.round((form.adventure_level ?? 0.3) * 100)}%
          </span>
          <input
            type="range"
            aria-label="Adventure level"
            min={0}
            max={1}
            step={0.1}
            value={form.adventure_level ?? 0.3}
            onChange={(e) => update('adventure_level', Number(e.target.value))}
            className="mt-3 w-full accent-brand-500"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <input
          type="checkbox"
          checked={form.rushed}
          onChange={(e) => update('rushed', e.target.checked)}
          className="h-4 w-4 accent-brand-500"
        />
        <span className="text-sm font-medium text-ink-soft">I’m in a rush today</span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary py-3">
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Analyzing…
          </>
        ) : (
          'Get my recommendation'
        )}
      </button>
    </form>
  )
}
