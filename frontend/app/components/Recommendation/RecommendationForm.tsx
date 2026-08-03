'use client'

import { useState } from 'react'
import type { RecommendationInput, RunType, ElevationPref } from '@/types'

const RUN_TYPES: { value: RunType; label: string; emoji: string; hint: string }[] = [
  { value: 'jog', label: 'Jog', emoji: '🚶', hint: 'Easy' },
  { value: 'light', label: 'Light', emoji: '🏃', hint: '30 min' },
  { value: 'mid', label: 'Mid', emoji: '🏃‍♂️', hint: '10 km' },
  { value: 'marathon', label: 'Long', emoji: '🏅', hint: 'Big day' },
]

const ELEV_PREFS: { value: ElevationPref; label: string; icon: string }[] = [
  { value: 'flat', label: 'Flat', icon: 'M4 12h16' },
  { value: 'up', label: 'Uphill', icon: 'M4 18L20 6' },
  { value: 'down', label: 'Downhill', icon: 'M4 6l16 12' },
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
        <div className="grid grid-cols-4 gap-2.5">
          {RUN_TYPES.map((rt) => {
            const active = form.feeling === rt.value
            return (
              <button
                type="button"
                key={rt.value}
                onClick={() => update('feeling', rt.value)}
                className={`group flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all duration-200 ${
                  active
                    ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                    : 'border-slate-200 bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card'
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${active ? 'drop-shadow' : ''}`}>
                  {rt.emoji}
                </span>
                <span className="text-sm font-bold leading-none">{rt.label}</span>
                <span className={`text-[10px] leading-none ${active ? 'text-white/80' : 'text-ink-muted'}`}>
                  {rt.hint}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="field-label">Elevation preference</span>
        <div className="grid grid-cols-3 gap-2.5">
          {ELEV_PREFS.map((ep) => {
            const active = form.pref_elevation === ep.value
            return (
              <button
                type="button"
                key={ep.value}
                onClick={() => update('pref_elevation', ep.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-2 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                    : 'border-slate-200 bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                  <path d={ep.icon} strokeWidth="2.2" strokeLinecap="round" />
                </svg>
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

      <button
        type="submit"
        disabled={loading}
        className="group relative overflow-hidden py-3.5 text-base btn-primary"
      >
        {/* sheen sweep */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Analyzing your run…
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path d="M13 2L4.5 12.5H11l-1 9.5 9.5-13H13l0-7z" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            Get my recommendation
          </>
        )}
      </button>
    </form>
  )
}
