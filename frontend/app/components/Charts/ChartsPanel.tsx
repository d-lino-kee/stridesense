'use client'

import { useSelector } from 'react-redux'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import type { RootState } from '@/store'

const SERIES = [
  { key: 'distance', label: 'Distance (km)', color: '#f96316' },
  { key: 'pace', label: 'Pace (min/km)', color: '#2563eb' },
  { key: 'soreness', label: 'Soreness', color: '#dc2626' },
]

export default function ChartsPanel() {
  const runs = useSelector((s: RootState) => s.runs.recent)
  const data = [...runs].reverse().map((r) => ({
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    distance: Number(r.distance_km.toFixed(1)),
    pace: Number((60 / Math.max(r.avg_speed, 0.1)).toFixed(2)),
    soreness: r.soreness_level,
  }))

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Trends</h2>
          <p className="text-xs text-ink-muted">Distance, pace and soreness over time</p>
        </div>
        <div className="hidden gap-4 sm:flex">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
          <p className="text-sm font-medium text-ink-soft">No runs yet</p>
          <p className="mt-1 text-xs text-ink-muted">Connect Strava or log a run to see your trends.</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            {data.length > 1 ? (
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f96316" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f96316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    boxShadow: '0 8px 24px -12px rgba(15,23,42,0.25)',
                  }}
                />
                <Area type="monotone" dataKey="distance" stroke="#f96316" strokeWidth={2} fill="url(#distFill)" />
                <Line type="monotone" dataKey="pace" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="soreness" stroke="#dc2626" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="distance" stroke="#f96316" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
