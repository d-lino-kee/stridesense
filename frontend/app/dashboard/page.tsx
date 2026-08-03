'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import DashboardHero from '@/components/Dashboard/DashboardHero'
import RunPlanner from '@/components/Planner/RunPlanner'
import ChartsPanel from '@/components/Charts/ChartsPanel'
import HistoryPanel from '@/components/History/HistoryPanel'
import AddRunModal from '@/components/History/AddRunModal'
import ChatPanel from '@/components/Chat/ChatPanel'
import StravaConnect from '@/components/Strava/StravaConnect'
import { useAuth } from '@/providers/AuthProvider'
import { setRuns, setLoading } from '@/store/slices/runsSlice'
import { apiFetch } from '@/api-client'
import type { RunRecord } from '@/types'

export default function Dashboard() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [addRunOpen, setAddRunOpen] = useState(false)

  // Firebase login is required to view the dashboard.
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    dispatch(setLoading(true))
    apiFetch<{ items: RunRecord[] }>('/runs?limit=30')
      .then((res) => {
        if (!cancelled) dispatch(setRuns(res.items ?? []))
      })
      .catch(() => !cancelled && dispatch(setRuns([])))
      .finally(() => !cancelled && dispatch(setLoading(false)))
    return () => {
      cancelled = true
    }
  }, [dispatch, user])

  if (authLoading || !user) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    )
  }

  const firstName = (user.displayName ?? user.email ?? 'Runner').split(/[\s@]/)[0]

  return (
    <div className="container-page py-8 sm:py-10">
      <DashboardHero firstName={firstName} />

      <div className="mb-6">
        <RunPlanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <ChartsPanel onAddRun={() => setAddRunOpen(true)} />
          <HistoryPanel />
        </div>
        <div className="grid content-start gap-6">
          {/* Manual logging entry point */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-brand-gradient p-5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M13 4l-2 6h4l-2 10M8 8l-3 2 2 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div>
                <h2 className="text-base font-bold">Track your runs</h2>
                <p className="text-xs text-white/85">Log by hand — no Strava required</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-ink-soft">Add each run yourself and your trends, history and recommendations update instantly.</p>
              <button type="button" onClick={() => setAddRunOpen(true)} className="btn-primary mt-4 w-full py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" /></svg>
                Log a run
              </button>
            </div>
          </section>

          <StravaConnect />
          <ChatPanel />
        </div>
      </div>

      <AddRunModal open={addRunOpen} onClose={() => setAddRunOpen(false)} />
    </div>
  )
}
