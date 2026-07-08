'use client'

import type { RecommendationResult } from '@/types'
import RecommendationCard from './RecommendationCard'

export default function RecommendationResultView({ result }: { result: RecommendationResult }) {
  return <RecommendationCard result={result} />
}
