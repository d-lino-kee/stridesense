'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import type { RootState } from '@/store'

type MetricKey = 'distance' | 'pace' | 'soreness'

const METRICS: { key: MetricKey; label: string; color: string; unit: string; help: string }[] = [
  { key: 'distance', label: 'Distance', color: '#f96316', unit: 'km', help: 'How far each run was' },
  { key: 'pace', label: 'Pace', color: '#2563eb', unit: 'min/km', help: 'Minutes per kilometre — lower is faster' },
  { key: 'soreness', label: 'Soreness', color: '#dc2626', unit: '/10', help: 'How sore you felt afterwards' },
]

export default function ChartsPanel({ onAddRun }: { onAddRun?: () => void }) {
  const [metric, setMetric] = useState<MetricKey>('distance')
  const runs = useSelector((s: RootState) => s.runs.recent)

  const data = [...runs].reverse().map((r) => ({
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    distance: Number(r.distance_km.toFixed(1)),
    pace: Number((60 / Math.max(r.avg_speed, 0.1)).toFixed(2)),
    soreness: r.soreness_level,
  }))

  const active = METRICS.find((m) => m.key === metric)!

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Trends</h2>
          <p className="text-xs text-ink-muted">{active.help}</p>
        </div>
        {/* Metric filter */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          {METRICS.map((m) => {
            const on = metric === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  on ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
          <span className="text-3xl">📈</span>
          <p className="mt-2 text-sm font-semibold text-ink-soft">No runs yet</p>
          <p className="mt-1 max-w-xs text-xs text-ink-muted">
            Don&apos;t want to connect Strava? Add your runs by hand and your trends fill in instantly.
          </p>
          {onAddRun && (
            <button type="button" onClick={onAddRun} className="btn-primary mt-4 px-4 py-2 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" /></svg>
              Add a run manually
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={active.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={active.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} ${active.unit}`, active.label]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    boxShadow: '0 8px 24px -12px rgba(15,23,42,0.25)',
                  }}
                />
                <Area type="monotone" dataKey={metric} stroke={active.color} strokeWidth={2.5} fill={`url(#fill-${metric})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {onAddRun && (
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={onAddRun} className="btn-ghost px-3 py-1.5 text-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" /></svg>
                Add run manually
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
