'use client'

import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Modal from '@/components/ui/Modal'
import { apiFetch } from '@/api-client'
import { setRuns } from '@/store/slices/runsSlice'
import type { RunRecord, RunType } from '@/types'

const TYPE: Record<RunType, { emoji: string; label: string; color: string }> = {
  jog: { emoji: '🚶', label: 'Jog', color: '#10b981' },
  light: { emoji: '🏃', label: 'Light', color: '#0ea5e9' },
  mid: { emoji: '🏃‍♂️', label: 'Mid', color: '#f96316' },
  marathon: { emoji: '🏅', label: 'Long', color: '#8b5cf6' },
}

function Stat({ value, unit, label, color }: { value: string; unit?: string; label: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
      <div className="text-xl font-black leading-none" style={{ color: color ?? '#0f172a' }}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-semibold text-ink-muted">{unit}</span>}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
    </div>
  )
}

export default function RunDetailModal({
  run,
  open,
  onClose,
}: {
  run: RunRecord | null
  open: boolean
  onClose: () => void
}) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [soreness, setSoreness] = useState(3)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (run) {
      setName(run.name ?? '')
      setNotes(run.notes ?? '')
      setSoreness(run.soreness_level)
      setConfirmDel(false)
      setErr(null)
    }
  }, [run])

  if (!run) return null

  const t = TYPE[run.run_type] ?? TYPE.mid
  const pace = 60 / Math.max(run.avg_speed, 0.1)
  const minutes = Math.round((run.distance_km / Math.max(run.avg_speed, 0.1)) * 60)
  const d = new Date(run.date)

  async function refresh() {
    const res = await apiFetch<{ items: RunRecord[] }>('/runs?limit=30')
    dispatch(setRuns(res.items ?? []))
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await apiFetch(`/runs/${run!.run_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() || null, notes: notes.trim() || null, soreness_level: soreness }),
      })
      await refresh()
      onClose()
    } catch {
      setErr('Could not save. Are you signed in and is the API running?')
    } finally {
      setSaving(false)
    }
  }

  async function del() {
    setDeleting(true)
    setErr(null)
    try {
      await apiFetch(`/runs/${run!.run_id}`, { method: 'DELETE' })
      await refresh()
      onClose()
    } catch {
      setErr('Could not delete this run.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-lift">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden px-6 py-6" style={{ background: `linear-gradient(135deg, ${t.color}22, #ffffff 70%)` }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: t.color }} />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-sm" style={{ background: t.color }}>
              {t.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${t.color}1a`, color: t.color }}>
                  {t.label}
                </span>
                {run.rushed && <span className="text-xs" title="Rushed">⏱️</span>}
              </div>
              <h2 className="mt-0.5 text-xl font-black text-ink">
                {name || d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-xs text-ink-muted">
                {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim p-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2">
            <Stat value={run.distance_km.toFixed(1)} unit="km" label="Distance" color={t.color} />
            <Stat value={`${minutes}`} unit="min" label="Duration" />
            <Stat value={pace.toFixed(1)} unit="/km" label="Pace" />
            <Stat value={`+${Math.round(run.avg_elevation)}`} unit="m" label="Climb" />
          </div>

          {/* Editable name */}
          <label className="mt-5 block">
            <span className="field-label">Name this run</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday long run"
              className="field-control"
            />
          </label>

          {/* Notes */}
          <label className="mt-4 block">
            <span className="field-label">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="How did it feel? Weather, effort, anything worth remembering…"
              className="field-control resize-none"
            />
          </label>

          {/* Soreness */}
          <div className="mt-4">
            <span className="field-label">Soreness afterwards · {soreness}/10</span>
            <input type="range" min={1} max={10} value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="mt-2 w-full accent-brand-500" />
          </div>

          {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn-primary flex-1 py-2.5">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {confirmDel ? (
              <button type="button" onClick={del} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
