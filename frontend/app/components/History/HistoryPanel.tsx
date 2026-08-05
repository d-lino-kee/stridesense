'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import RunDetailModal from './RunDetailModal'
import type { RootState } from '@/store'
import type { RunRecord, RunType } from '@/types'

const TYPE: Record<RunType, { emoji: string; label: string; color: string }> = {
  jog: { emoji: '🚶', label: 'Jog', color: '#10b981' },
  light: { emoji: '🏃', label: 'Light', color: '#0ea5e9' },
  mid: { emoji: '🏃‍♂️', label: 'Mid', color: '#f96316' },
  marathon: { emoji: '🏅', label: 'Long', color: '#8b5cf6' },
}

const SEASON_EMOJI: Record<string, string> = {
  winter: '❄️',
  spring: '🌱',
  summer: '☀️',
  fall: '🍂',
}

function sorenessColor(level: number) {
  if (level >= 7) return '#ef4444'
  if (level >= 4) return '#f59e0b'
  return '#10b981'
}

export default function HistoryPanel() {
  const runs = useSelector((s: RootState) => s.runs.recent)
  const loading = useSelector((s: RootState) => s.runs.loading)
  const [selected, setSelected] = useState<RunRecord | null>(null)

  const totalKm = runs.reduce((a, r) => a + r.distance_km, 0)

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Recent runs</h2>
          <p className="text-xs text-ink-muted">Your latest logged activity</p>
        </div>
        {runs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="chip bg-slate-100 text-ink-soft">{runs.length} runs</span>
            <span className="chip bg-brand-50 text-brand-700">{totalKm.toFixed(0)} km total</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[68px] w-full" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-3 py-8 text-center">
          <span className="text-3xl">👟</span>
          <p className="mt-2 text-sm font-semibold text-ink-soft">No runs yet</p>
          <p className="mt-1 text-xs text-ink-muted">Log a run to start building your history.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {runs.map((r, i) => {
            const t = TYPE[r.run_type] ?? TYPE.mid
            const pace = 60 / Math.max(r.avg_speed, 0.1)
            const sore = sorenessColor(r.soreness_level)
            const d = new Date(r.date)
            return (
              <li
                key={r.run_id ?? i}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-card"
              >
                {/* accent rail */}
                <span className="absolute left-0 top-0 h-full w-1" style={{ background: t.color }} />
                <button type="button" onClick={() => setSelected(r)} className="flex w-full items-center gap-3 pl-2 text-left">
                  {/* type badge */}
                  <div
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ background: t.color }}
                  >
                    <span className="text-xl leading-none">{t.emoji}</span>
                  </div>

                  {/* details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">
                        {r.name || d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `${t.color}1a`, color: t.color }}
                      >
                        {t.label}
                      </span>
                      {r.rushed && <span title="Rushed run" className="text-xs">⏱️</span>}
                      {r.season && <span title={r.season} className="text-xs">{SEASON_EMOJI[r.season] ?? ''}</span>}
                    </div>

                    <div className="mt-1.5 flex items-center gap-4">
                      <span className="flex items-baseline gap-1">
                        <span className="text-lg font-black leading-none" style={{ color: t.color }}>
                          {r.distance_km.toFixed(1)}
                        </span>
                        <span className="text-[11px] font-semibold text-ink-muted">km</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5 text-ink-muted"><circle cx="12" cy="13" r="7" strokeWidth="1.7" /><path d="M12 13V9M9 2h6" strokeWidth="1.7" strokeLinecap="round" /></svg>
                        <b className="font-bold text-ink">{pace.toFixed(1)}</b> /km
                      </span>
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5 text-ink-muted"><path d="M3 20l6-12 4 7 3-5 5 10z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                        <b className="font-bold text-ink">+{Math.round(r.avg_elevation)}</b> m
                      </span>
                    </div>
                  </div>

                  {/* soreness dial */}
                  <div className="flex shrink-0 flex-col items-center">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ background: sore }}
                    >
                      {r.soreness_level}
                    </div>
                    <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-muted">soreness</span>
                  </div>

                  {/* edit affordance */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-400"><path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <RunDetailModal run={selected} open={!!selected} onClose={() => setSelected(null)} />
    </section>
  )
}
