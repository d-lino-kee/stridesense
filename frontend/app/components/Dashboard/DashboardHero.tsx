'use client'

import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

function Stat({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode
  value: string
  label: string
  accent: string
}) {
  return (
    <div className="stat-pill">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: accent }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-lg font-black text-ink">{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardHero({ firstName }: { firstName: string }) {
  const runs = useSelector((s: RootState) => s.runs.recent)

  const totalKm = runs.reduce((a, r) => a + r.distance_km, 0)
  const avgPace =
    runs.length > 0
      ? runs.reduce((a, r) => a + 60 / Math.max(r.avg_speed, 0.1), 0) / runs.length
      : 0
  const totalElev = runs.reduce((a, r) => a + (r.avg_elevation || 0), 0)
  const streak = Math.min(runs.length, 7)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-brand-mesh p-6 shadow-card animate-fade-up sm:p-8">
      {/* decorative floating blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-gradient opacity-20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              {greeting}, {firstName} 👋
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Ready for your <span className="gradient-text">next run?</span>
            </h1>
            <p className="mt-2 max-w-xl text-ink-muted">
              Personalized route picks tuned to how you feel and your recent activity.
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Model synced
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            accent="#f96316"
            label="Total distance"
            value={`${totalKm.toFixed(1)} km`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path d="M4 12h4l2-8 4 16 2-8h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <Stat
            accent="#2563eb"
            label="Avg pace"
            value={avgPace ? `${avgPace.toFixed(1)}'/km` : '—'}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <circle cx="12" cy="13" r="7" strokeWidth="1.8" />
                <path d="M12 13V9M12 2h4M12 6V2" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          />
          <Stat
            accent="#10b981"
            label="Runs logged"
            value={`${runs.length}`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path d="M13 4l-2 6h4l-2 10M8 8l-3 2 2 3M16 14l3 1-1 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <Stat
            accent="#8b5cf6"
            label="Elevation gain"
            value={`+${Math.round(totalElev)} m`}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path d="M3 20l6-12 4 7 3-5 5 10z" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>

        {streak > 0 && (
          <p className="mt-4 text-sm font-medium text-ink-soft">
            🔥 You&apos;re on a{' '}
            <span className="font-bold text-brand-600">{streak}-run streak</span> — keep it going!
          </p>
        )}
      </div>
    </div>
  )
}
