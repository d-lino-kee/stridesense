'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import Modal from '@/components/ui/Modal'
import { apiFetch } from '@/api-client'
import { setRuns } from '@/store/slices/runsSlice'
import { useAuth } from '@/providers/AuthProvider'
import type { RunRecord, RunType } from '@/types'

const TYPES: { value: RunType; label: string; emoji: string }[] = [
  { value: 'jog', label: 'Jog', emoji: '🚶' },
  { value: 'light', label: 'Light', emoji: '🏃' },
  { value: 'mid', label: 'Mid', emoji: '🏃‍♂️' },
  { value: 'marathon', label: 'Long', emoji: '🏅' },
]

function seasonFromDate(d: Date): string {
  const m = d.getMonth() + 1
  if (m === 12 || m <= 2) return 'winter'
  if (m <= 5) return 'spring'
  if (m <= 8) return 'summer'
  return 'fall'
}

export default function AddRunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [runName, setRunName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [runType, setRunType] = useState<RunType>('mid')
  const [distance, setDistance] = useState('8')
  const [duration, setDuration] = useState('45')
  const [elevation, setElevation] = useState('60')
  const [soreness, setSoreness] = useState(3)
  const [rushed, setRushed] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    const dist = Number(distance)
    const mins = Number(duration)
    if (!dist || !mins) {
      setErr('Enter a distance and duration.')
      return
    }
    setSaving(true)
    const d = new Date(date + 'T07:00:00')
    try {
      await apiFetch('/runs', {
        method: 'POST',
        body: JSON.stringify({
          date: d.toISOString(),
          day_of_week: d.getDay(),
          season: seasonFromDate(d),
          run_type: runType,
          distance_km: dist,
          avg_speed: dist / (mins / 60),
          avg_elevation: Number(elevation) || 0,
          soreness_level: soreness,
          rushed,
          name: runName.trim() || null,
        }),
      })
      const runs = await apiFetch<{ items: RunRecord[] }>('/runs?limit=30')
      dispatch(setRuns(runs.items ?? []))
      setMsg('Run logged! Your trends and model just updated. 🎉')
    } catch (e) {
      setErr(
        e instanceof Error && e.message.includes('401')
          ? 'Sign in to log runs to your account.'
          : 'Could not save the run. Is the API running?',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-lift">
        <div className="flex shrink-0 items-center gap-3 bg-brand-gradient px-6 py-5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M13 4l-2 6h4l-2 10M8 8l-3 2 2 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <h2 className="text-lg font-bold">Log a run</h2>
            <p className="text-xs text-white/85">No Strava needed — add it yourself</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid min-h-0 flex-1 gap-4 overflow-y-auto scrollbar-slim p-6">
          <label>
            <span className="field-label">Name <span className="font-normal text-ink-muted">(optional)</span></span>
            <input value={runName} onChange={(e) => setRunName(e.target.value)} placeholder="e.g. Sunday long run" className="field-control" />
          </label>
          <div>
            <span className="field-label">Run type</span>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => {
                const on = runType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setRunType(t.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 transition ${
                      on ? 'border-transparent bg-brand-gradient text-white shadow-glow' : 'border-slate-200 bg-white text-ink-soft hover:border-brand-200'
                    }`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="field-label">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field-control" />
            </label>
            <label>
              <span className="field-label">Distance (km)</span>
              <input type="number" step="0.1" min="0" value={distance} onChange={(e) => setDistance(e.target.value)} className="field-control" />
            </label>
            <label>
              <span className="field-label">Duration (min)</span>
              <input type="number" step="1" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className="field-control" />
            </label>
            <label>
              <span className="field-label">Elevation (m)</span>
              <input type="number" step="1" min="0" value={elevation} onChange={(e) => setElevation(e.target.value)} className="field-control" />
            </label>
          </div>

          <div>
            <span className="field-label">How sore afterwards? · {soreness}/10</span>
            <input type="range" min={1} max={10} value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="mt-2 w-full accent-brand-500" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <input type="checkbox" checked={rushed} onChange={(e) => setRushed(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            <span className="text-sm font-medium text-ink-soft">I was rushed</span>
          </label>

          <button type="submit" disabled={saving} className="btn-primary py-3">
            {saving ? 'Saving…' : 'Save run'}
          </button>
          {msg && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
          {!user && <p className="text-center text-xs text-ink-muted">Sign in to attribute runs to your account.</p>}
        </form>
      </div>
    </Modal>
  )
}
