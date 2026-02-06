'use client'

import { useState } from 'react'
import RecommendationForm from './RecommendationForm'
import RecommendationResult from './RecommendationResult'
import { apiFetch } from '@/api-client'
import { RecommendationInput, RecommendationResult as Result } from '@/types'


export default function RecommendationPanel() {
    const [result, setResult] = useState<Result | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handlesubmit(input: RecommendationInput){
        setLoading(true)
        setError(null)

        try {
            const res = await apiFetch<Result>('/recommendation', {
                method: 'POST',
                body: JSON.stringify(input),
            })
            if ('__mock' in res) throw new Error('Mock response')
            setResult(res)
        } catch (e: any) {
            setError(e.message ?? 'Failed to fetch recommendation')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="border rounded-2xl bg-white p-6 shadow-sm">
        <h2 style={{ marginTop: 0 }}>Recommended Run</h2>

        <RecommendationForm onSubmit={handleSubmit} loading={loading} />

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {result && <RecommendationResult result={result} />}
        </section>
    )
}