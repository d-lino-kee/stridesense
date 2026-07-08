'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import Page from '@/components/Page'
import RecommendationPanel from '@/components/Recommendation/RecommendationPanel'
import ChartsPanel from '@/components/Charts/ChartsPanel'
import RoutesPanel from '@/components/Routes/RoutesPanel'
import HistoryPanel from '@/components/History/HistoryPanel'
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
    <Page
      title={`Welcome back, ${firstName}`}
      subtitle="Personalized recommendations from your activity history."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <RecommendationPanel />
          <ChartsPanel />
          <HistoryPanel />
        </div>
        <div className="grid content-start gap-6">
          <StravaConnect />
          <RoutesPanel />
          <ChatPanel />
        </div>
      </div>
    </Page>
  )
}
