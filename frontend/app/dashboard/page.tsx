'use client'
import React, { useEffect } from 'react'
import Page from '@/components/Page'
import RecommendationPanel from '@/components/Recommendation/RecommendationPanel'
import ChartsPanel from '@/components/Charts/ChartsPanel'
import RoutesPanel from '@/components/Routes/RoutesPanel'
import HistoryPanel from '@/components/History/HistoryPanel'
import LegacyPlanner from './LegacyPlanner'
import { useDispatch } from 'react-redux'
import { setRuns } from '@/store/slices/runsSlice'
import { apiFetch } from '@/api-client'

export default function Dashboard() {
    const dispatch = useDispatch()
    useEffect(() => {
        (async () => {
            const res = await apiFetch<{items:any[]}>(`/runs`)
            const items = (res as any).__mock ? [] : (res as any).items
            dispatch(setRuns(items?.slice?.(0, 10) || []))
        })()
    }, [dispatch])

    return (
  <Page title="Dashboard" subtitle="React + Redux + AngularJS micro-app">
    <div className="container" style={{ padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Left column – empty for now */}
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <div className="border rounded-2xl bg-white p-4 shadow-sm">
            <h3 style={{ marginTop: 0 }}>Legacy Planner (AngularJS)</h3>
            <LegacyPlanner />
          </div>
        </div>
      </div>
    </div>
  </Page>
)
}