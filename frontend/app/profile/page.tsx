'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '@/providers/AuthProvider'
import { apiFetch } from '@/api-client'
import Avatar from '@/components/Avatar'
import type { RunRecord } from '@/types'

function StatCard({
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
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-10 blur-xl transition group-hover:opacity-20"
        style={{ background: accent }}
      />
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
        style={{ background: accent }}
      >
        {icon}
      </span>
      <div className="mt-3 text-2xl font-black text-ink">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  copyable,
}: {
  icon: React.ReactNode
  label: string
  value: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-3 px-1 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-soft">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="truncate text-sm font-semibold text-ink">{value}</div>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          }}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-600"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [runs, setRuns] = useState<RunRecord[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiFetch<{ items: RunRecord[] }>('/runs?limit=100')
      .then((res) => !cancelled && setRuns(res.items ?? []))
      .catch(() => !cancelled && setRuns([]))
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    )
  }

  const initial = (user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()
  const name = user.displayName ?? 'Runner'
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const totalKm = runs.reduce((a, r) => a + r.distance_km, 0)
  const avgPace =
    runs.length > 0
      ? runs.reduce((a, r) => a + 60 / Math.max(r.avg_speed, 0.1), 0) / runs.length
      : 0
  const totalElev = runs.reduce((a, r) => a + (r.avg_elevation || 0), 0)

  return (
    <div className="container-page py-8 sm:py-10">
      {/* Profile card */}
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card animate-fade-up">
          {/* Cover */}
          <div className="relative h-36 bg-brand-mesh sm:h-40">
            <div className="absolute inset-0 bg-brand-gradient opacity-90" />
            <div className="absolute inset-0 bg-hero-grid bg-[length:22px_22px] opacity-30" />
            <div className="pointer-events-none absolute -right-8 top-4 h-32 w-32 rounded-full bg-white/20 blur-2xl animate-float" />
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 17.7l.9-5.4L4.2 8.5l5.4-.8L12 2z" />
              </svg>
              StrideSense member
            </span>
          </div>

          {/* Identity */}
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex items-end justify-between">
              <div className="flex items-end gap-4">
                <span className="rounded-[34%] bg-white p-1 shadow-lift">
                  <Avatar src={user.photoURL} initial={initial} size={92} status />
                </span>
              </div>
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Verified
              </span>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-black tracking-tight text-ink">{name}</h1>
              <p className="text-sm text-ink-muted">{user.email ?? '—'}</p>
              <p className="mt-1 text-xs text-ink-muted">Running with StrideSense since {memberSince}</p>
            </div>

            {/* Activity snapshot */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                accent="#f96316"
                label="Total distance"
                value={`${totalKm.toFixed(0)} km`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M4 12h4l2-8 4 16 2-8h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              />
              <StatCard
                accent="#2563eb"
                label="Avg pace"
                value={avgPace ? `${avgPace.toFixed(1)}'` : '—'}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><circle cx="12" cy="13" r="7" strokeWidth="1.8" /><path d="M12 13V9M9 2h6" strokeWidth="1.8" strokeLinecap="round" /></svg>}
              />
              <StatCard
                accent="#10b981"
                label="Runs logged"
                value={`${runs.length}`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M13 4l-2 6h4l-2 10M8 8l-3 2 2 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              />
              <StatCard
                accent="#8b5cf6"
                label="Elevation"
                value={`${(totalElev / 1000).toFixed(1)}k m`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M3 20l6-12 4 7 3-5 5 10z" strokeWidth="1.8" strokeLinejoin="round" /></svg>}
              />
            </div>
          </div>
        </div>

        {/* Account + connections */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="mb-2 text-base font-bold text-ink">Account details</h2>
            <div className="divide-y divide-slate-100">
              <DetailRow
                label="Full name"
                value={name}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><circle cx="12" cy="8" r="4" strokeWidth="1.8" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeWidth="1.8" strokeLinecap="round" /></svg>}
              />
              <DetailRow
                label="Email"
                value={user.email ?? '—'}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" /><path d="M4 7l8 6 8-6" strokeWidth="1.8" strokeLinecap="round" /></svg>}
              />
              <DetailRow
                label="User ID"
                value={user.uid}
                copyable
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2" strokeWidth="1.8" /><rect x="3" y="8" width="12" height="12" rx="2" strokeWidth="1.8" /></svg>}
              />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-2 text-base font-bold text-ink">Connected services</h2>
            <ul className="mt-2 space-y-3">
              {[
                { name: 'Google', desc: 'Sign-in identity provider', on: true, color: '#ea4335' },
                { name: 'Strava', desc: 'Import your run history', on: false, color: '#fc4c02' },
                { name: 'Google Maps', desc: 'Route & elevation data', on: false, color: '#34a853' },
              ].map((svc) => (
                <li
                  key={svc.name}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: svc.color }}
                  >
                    {svc.name.charAt(0)}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">{svc.name}</div>
                    <div className="text-[11px] text-ink-muted">{svc.desc}</div>
                  </div>
                  <span
                    className={`chip ${
                      svc.on
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'bg-slate-100 text-ink-muted'
                    }`}
                  >
                    {svc.on ? 'Connected' : 'Not linked'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-primary px-5 py-2.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><rect x="3" y="3" width="7" height="9" rx="1.5" strokeWidth="1.8" /><rect x="14" y="3" width="7" height="5" rx="1.5" strokeWidth="1.8" /><rect x="14" y="12" width="7" height="9" rx="1.5" strokeWidth="1.8" /><rect x="3" y="16" width="7" height="5" rx="1.5" strokeWidth="1.8" /></svg>
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut(auth)
              router.replace('/login')
            }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft shadow-sm transition-all hover:border-red-200 hover:text-red-600"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-red-50 transition-transform duration-300 group-hover:translate-x-0" />
            <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0"><path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute h-4 w-4 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"><path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="relative">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
