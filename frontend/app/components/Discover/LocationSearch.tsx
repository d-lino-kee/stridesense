'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/api-client'

export type Place = { label: string; display_name: string; lat: number; lng: number }

export default function LocationSearch({
  placeholder,
  initial,
  onSelect,
  onQueryChange,
  icon,
}: {
  placeholder: string
  initial?: string
  onSelect: (p: Place) => void
  onQueryChange?: (q: string) => void
  icon?: React.ReactNode
}) {
  const [q, setQ] = useState(initial ?? '')
  const [items, setItems] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([])
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await apiFetch<{ items: Place[] }>(`/geo/search?q=${encodeURIComponent(q)}`)
        setItems(r.items ?? [])
        setOpen(true)
        setActive(0)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer.current)
  }, [q])

  function choose(p: Place) {
    setQ(p.label)
    onQueryChange?.(p.label)
    setOpen(false)
    onSelect(p)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
        <span className="text-ink-muted">{icon}</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            onQueryChange?.(e.target.value)
          }}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, items.length - 1))
            else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
            else if (e.key === 'Enter' && open && items[active]) {
              e.preventDefault()
              choose(items[active])
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted"
        />
        {loading && (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
        )}
      </div>

      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto scrollbar-slim rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift">
          {items.map((p, i) => (
            <li key={`${p.lat},${p.lng},${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(p)}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  i === active ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500">
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" strokeWidth="1.6" />
                  <circle cx="12" cy="11" r="2.2" strokeWidth="1.6" />
                </svg>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{p.label}</span>
                  <span className="block truncate text-[11px] text-ink-muted">{p.display_name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
