'use client'

import type { RecommendationResult } from '@/types'

export default function RecommendationResultView({
  result,
}: {
  result: RecommendationResult
}) {
  return (
    <div style={{ marginTop: 24 }}>
      <h3>Route: {result.route.name}</h3>
      <ul>
        <li>Distance: {result.route.distance_km} km</li>
        <li>Elevation gain: {result.route.elevation_gain} m</li>
        <li>Predicted soreness: {result.predicted_soreness} / 10</li>
      </ul>
      <p style={{ opacity: 0.8 }}>{result.rationale}</p>
    </div>
  )
}

