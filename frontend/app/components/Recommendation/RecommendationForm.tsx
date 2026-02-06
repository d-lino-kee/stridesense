'use client'

import { useState } from 'react'
import { RecommendationInput, RunType } from '@/types'

export default function RecommendationForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: RecommendationInput) => void
  loading: boolean
}) {
  const [form, setForm] = useState<RecommendationInput>({
    feeling: 'jog',
    rushed: false,
    day_of_week: new Date().getDay(),
    season: 'spring',
    pref_elevation: 'flat',
  })

  function update<K extends keyof RecommendationInput>(
    key: K,
    value: RecommendationInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label>
        Run type
        <select
          value={form.feeling}
          onChange={(e) => update('feeling', e.target.value as RunType)}
        >
          <option value="jog">Jog</option>
          <option value="light">Light</option>
          <option value="mid">Mid</option>
          <option value="marathon">Marathon prep</option>
        </select>
      </label>

      <label>
        Elevation preference
        <select
          value={form.pref_elevation}
          onChange={(e) =>
            update('pref_elevation', e.target.value as any)
          }
        >
          <option value="flat">Flat</option>
          <option value="up">Uphill</option>
          <option value="down">Downhill</option>
        </select>
      </label>

      <label>
        Time available (minutes)
        <input
          type="number"
          placeholder="Optional"
          onChange={(e) =>
            update('time_available_min', Number(e.target.value))
          }
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={form.rushed}
          onChange={(e) => update('rushed', e.target.checked)}
        />
        In a rush today
      </label>

      <button
        onClick={() => onSubmit(form)}
        disabled={loading}
        style={{ marginTop: 8 }}
      >
        {loading ? 'Analyzing…' : 'Get recommendation'}
      </button>
    </div>
  )
}
