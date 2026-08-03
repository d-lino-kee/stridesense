'use client'

/**
 * Shows a 0-10 value as a marker sliding along a coloured spectrum, with plain
 * descriptive endpoints so the number is easy to read at a glance.
 */
export default function SpectrumBar({
  value,
  kind,
}: {
  value: number
  kind: 'suitability' | 'soreness'
}) {
  const pct = Math.max(0, Math.min(10, value)) / 10
  const left = pct * 100

  const cfg =
    kind === 'suitability'
      ? {
          title: 'Suitability',
          gradient: 'linear-gradient(90deg,#e2e8f0 0%,#fdba74 55%,#f96316 100%)',
          low: 'So-so',
          high: 'Perfect fit',
          word:
            value >= 8.5 ? 'Perfect fit' : value >= 7 ? 'Great match' : value >= 5 ? 'Decent' : 'So-so',
        }
      : {
          title: 'Predicted soreness',
          gradient: 'linear-gradient(90deg,#10b981 0%,#f59e0b 55%,#ef4444 100%)',
          low: 'Easy on the legs',
          high: 'Tough',
          word:
            value >= 7.5 ? 'Tough' : value >= 5 ? 'Moderate' : value >= 3 ? 'Manageable' : 'Easy on the legs',
        }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-soft">{cfg.title}</span>
        <span className="text-sm font-bold text-ink">
          {cfg.word} <span className="text-ink-muted">· {value.toFixed(1)}/10</span>
        </span>
      </div>
      <div className="relative h-2.5 rounded-full" style={{ background: cfg.gradient }}>
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink shadow-lift transition-all duration-500"
          style={{ left: `calc(${left}% - 10px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-ink-muted">
        <span>{cfg.low}</span>
        <span>{cfg.high}</span>
      </div>
    </div>
  )
}
