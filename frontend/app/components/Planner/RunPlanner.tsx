'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationSearch, { type Place } from '@/components/Discover/LocationSearch'
import { type PlannerRoute } from './RouteModal'
import Switch from '@/components/ui/Switch'
import SpectrumBar from '@/components/ui/SpectrumBar'
import { apiFetch } from '@/api-client'
import { tracerEmbedFromWaypoints, terrainStats, directionsUrl, type WaterlooRoute } from '@/data/waterlooRoutes'

const FEELINGS = [
  { value: 'jog', label: 'Jog', emoji: '🚶', hint: 'Easy day' },
  { value: 'light', label: 'Light', emoji: '🏃', hint: '~30 min' },
  { value: 'mid', label: 'Mid', emoji: '🏃‍♂️', hint: '~10 km' },
  { value: 'marathon', label: 'Long', emoji: '🏅', hint: 'Big day' },
]
const ELEVS = [
  { value: 'flat', label: 'Flat', emoji: '➖' },
  { value: 'up', label: 'Climb', emoji: '⛰️' },
  { value: 'down', label: 'Downhill', emoji: '🏂' },
]
const WHENS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
]

function whenToDow(key: string): number {
  const today = new Date().getDay()
  if (key === 'tomorrow') return (today + 1) % 7
  if (key === 'weekend') return 6
  return today
}

function fmtTime(min: number) {
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function adventureWord(a: number) {
  if (a < 0.25) return 'Homebody'
  if (a < 0.5) return 'Curious'
  if (a < 0.75) return 'Explorer'
  return 'Trailblazer'
}

export default function RunPlanner() {
  const [area, setArea] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [start, setStart] = useState<Place | null>(null)
  const [end, setEnd] = useState<Place | null>(null)
  const [loop, setLoop] = useState(true)

  const [feeling, setFeeling] = useState('mid')
  const [prefElev, setPrefElev] = useState('flat')
  const [adventure, setAdventure] = useState(0.4)
  const [autoDist, setAutoDist] = useState(true)
  const [targetKm, setTargetKm] = useState(8)
  const [rushed, setRushed] = useState(false)
  const [when, setWhen] = useState('today')

  const [results, setResults] = useState<PlannerRoute[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ target?: number; personalized?: boolean }>({})
  const router = useRouter()

  function openRoute(r: PlannerRoute) {
    try {
      sessionStorage.setItem(`route:${r.slug}`, JSON.stringify(r))
    } catch {
      /* ignore quota errors */
    }
    router.push(`/route/${r.slug}`)
  }

  const selected = results.find((r) => r.id === selectedId) ?? results[0]
  const top = results[0]
  const mapSrc = useMemo(() => (selected ? tracerEmbedFromWaypoints(selected.waypoints) : ''), [selected])

  async function generate() {
    setLoading(true)
    setError(null)

    // If the user typed a city but didn't pick a suggestion, resolve it now.
    let origin = start
    if (!origin && cityQuery.trim().length >= 2) {
      try {
        const geo = await apiFetch<{ items: Place[] }>(`/geo/search?q=${encodeURIComponent(cityQuery)}`)
        if (geo.items?.[0]) {
          origin = geo.items[0]
          setStart(origin)
          setArea(origin.label)
        }
      } catch {
        /* fall through to the error below */
      }
    }
    if (!origin) {
      setError('Type a city and pick it from the list (or use your location) first.')
      setLoading(false)
      return
    }

    try {
      const body = {
        start_lat: origin.lat,
        start_lng: origin.lng,
        ...(!loop && end ? { end_lat: end.lat, end_lng: end.lng } : {}),
        area: area || origin.label,
        feeling,
        pref_elevation: prefElev,
        adventure_level: adventure,
        rushed,
        day_of_week: whenToDow(when),
        ...(autoDist ? {} : { target_distance_km: targetKm }),
      }
      const res = await apiFetch<{ items: PlannerRoute[]; target_km: number; personalized: boolean }>(
        '/discover',
        { method: 'POST', body: JSON.stringify(body) },
      )
      setResults(res.items)
      setVisibleCount(10)
      setSelectedId(res.items[0]?.id ?? null)
      setMeta({ target: res.target_km, personalized: res.personalized })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not plan routes. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  const feelingPhrase =
    { jog: 'like an easy jog', light: 'like a light run', mid: 'like a solid run', marathon: 'up for a long one' }[
      feeling
    ] ?? 'ready to run'
  const terrainPhrase =
    prefElev === 'flat' ? 'want to keep it flat' : prefElev === 'up' ? 'fancy some climbing' : 'prefer a downhill lean'
  const whyText = top
    ? `You feel ${feelingPhrase} and ${terrainPhrase}, so this ${top.distanceKm.toFixed(1)} km ${top.surface.toLowerCase()} run comes out as your best match today.`
    : ''

  return (
    <section className="card-glass overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path d="M13 2L4.5 12.5H11l-1 9.5 9.5-13H13l0-7z" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Plan your run</h2>
            <p className="text-xs text-ink-muted">Tune the dials and the model finds your top routes</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {/* ---- Controls (gamified) ---- */}
        <div className="grid content-start gap-5">
          {/* Where */}
          <div>
            <span className="field-label">Where are you running?</span>
            <LocationSearch
              placeholder="Search a city, e.g. Waterloo, Ontario"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M3 21h18M6 21V8l6-4 6 4v13M10 21v-4h4v4" strokeWidth="1.6" strokeLinejoin="round" /></svg>}
              onSelect={(p) => { setArea(p.label); setStart(p) }}
              onQueryChange={(v) => { setCityQuery(v); if (start) setStart(null) }}
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => 'geolocation' in navigator && navigator.geolocation.getCurrentPosition((pos) => setStart({ label: 'My location', display_name: 'Current position', lat: pos.coords.latitude, lng: pos.coords.longitude }))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"
              >
                📍 Use my location
              </button>
              {start && <span className="truncate text-xs text-ink-muted">{start.label}</span>}
            </div>
          </div>

          {/* Feeling */}
          <div>
            <span className="field-label">How do you feel?</span>
            <div className="grid grid-cols-4 gap-2">
              {FEELINGS.map((f) => {
                const on = feeling === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFeeling(f.value)}
                    className={`group flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all duration-200 ${
                      on ? 'border-transparent bg-brand-gradient text-white shadow-glow' : 'border-slate-200 bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card'
                    }`}
                  >
                    <span className="text-xl transition-transform group-hover:scale-125">{f.emoji}</span>
                    <span className="text-sm font-bold leading-none">{f.label}</span>
                    <span className={`text-[10px] leading-none ${on ? 'text-white/80' : 'text-ink-muted'}`}>{f.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Elevation */}
          <div>
            <span className="field-label">Terrain mood</span>
            <div className="grid grid-cols-3 gap-2">
              {ELEVS.map((e) => {
                const on = prefElev === e.value
                return (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setPrefElev(e.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      on ? 'border-transparent bg-brand-gradient text-white shadow-glow' : 'border-slate-200 bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-200'
                    }`}
                  >
                    <span>{e.emoji}</span>
                    {e.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Adventure meter */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="field-label mb-0">Adventure level</span>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {adventureWord(adventure)} · {Math.round(adventure * 100)}%
              </span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={adventure} onChange={(e) => setAdventure(Number(e.target.value))} className="w-full accent-brand-500" />
            <div className="mt-0.5 flex justify-between text-[10px] font-medium text-ink-muted">
              <span>Familiar streets</span><span>Off the beaten path</span>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="field-label mb-0">Target distance</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                Auto <Switch checked={autoDist} onChange={setAutoDist} />
              </label>
            </div>
            {autoDist ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-ink-muted">Chosen from how you feel</p>
            ) : (
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={25} step={0.5} value={targetKm} onChange={(e) => setTargetKm(Number(e.target.value))} className="w-full accent-brand-500" />
                <span className="w-16 shrink-0 text-right text-sm font-bold text-ink">{targetKm.toFixed(1)} km</span>
              </div>
            )}
          </div>

          {/* When + toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">When?</span>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                {WHENS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setWhen(w.key)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      when === w.key ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <span className="text-sm font-medium text-ink-soft">🔁 Loop back</span>
                <Switch checked={loop} onChange={setLoop} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <span className="text-sm font-medium text-ink-soft">⏱️ In a rush</span>
                <Switch checked={rushed} onChange={setRushed} />
              </label>
            </div>
          </div>

          {!loop && (
            <div>
              <span className="field-label">Finish location</span>
              <LocationSearch placeholder="Search a finish point" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" strokeWidth="1.6" /></svg>} onSelect={setEnd} />
            </div>
          )}

          <button type="button" onClick={generate} disabled={loading || (!start && cityQuery.trim().length < 2)} className="group relative overflow-hidden py-3.5 text-base btn-primary">
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Finding your routes…</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><circle cx="11" cy="11" r="7" strokeWidth="1.8" /><path d="M21 21l-4-4" strokeWidth="1.8" strokeLinecap="round" /></svg> Find my top routes</>
            )}
          </button>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* ---- Results ---- */}
        <div className="grid content-start gap-4">
          {!top ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <span className="text-4xl">🗺️</span>
              <p className="mt-3 font-semibold text-ink">Your routes will appear here</p>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">Set where you are and how you feel, then hit <b>Find my top routes</b>.</p>
            </div>
          ) : (
            <>
              {/* Top pick hero */}
              <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
                <span className="chip absolute right-4 top-4 bg-brand-gradient text-white shadow-glow">Top pick</span>
                <h3 className="pr-24 text-lg font-black text-ink">{top.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{whyText}</p>
                <div className="mt-4 grid gap-4">
                  <SpectrumBar kind="suitability" value={top.score} />
                  <SpectrumBar kind="soreness" value={top.soreness} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openRoute(top)} className="btn-primary py-2.5">
                    View details
                  </button>
                  <a href={directionsUrl(top.waypoints)} target="_blank" rel="noopener noreferrer" className="btn-ghost py-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M3 11l19-9-9 19-2-8-8-2z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                    Directions
                  </a>
                </div>
              </div>

              {/* Selected route map (updates when picking from list) */}
              {selected && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/70">
                  <div className="relative h-56 bg-slate-100">
                    <iframe key={mapSrc} title={`Map — ${selected.name}`} src={mapSrc} loading="lazy" className="absolute inset-0 h-full w-full" style={{ border: 0 }} referrerPolicy="no-referrer-when-downgrade" />
                    <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
                      <span className="chip bg-white/90 text-ink-soft shadow-card">{selected.distanceKm.toFixed(1)} km</span>
                      <span className="chip bg-white/90 text-ink-soft shadow-card">+{selected.elevationM} m</span>
                      <span className="chip bg-white/90 text-ink-soft shadow-card">⛰ {terrainStats(selected).maxGradePct}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranked list */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">
                  Showing {Math.min(visibleCount, results.length)} of {results.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`chip ${meta.personalized ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-ink-muted'}`}>
                    {meta.personalized ? 'Tuned to your runs' : 'Generic profile'}
                  </span>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={loading}
                    title="Refresh routes"
                    className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition hover:border-brand-200 hover:text-brand-600"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-4 w-4 ${loading ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}`}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v5h-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
              <div className="max-h-[620px] space-y-3 overflow-y-auto scrollbar-slim pr-1">
                {results.slice(0, visibleCount).map((r, i) => {
                  const on = r.id === selected?.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedId(r.id!)}
                      style={{
                        background: `linear-gradient(135deg, ${r.accent}12, #ffffff 70%)`,
                        ...(on ? { boxShadow: `0 0 0 2px ${r.accent}, 0 16px 40px -18px ${r.accent}80` } : {}),
                      }}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all ${on ? 'border-transparent -translate-y-0.5' : 'border-slate-200/70 hover:-translate-y-0.5 hover:shadow-card'}`}
                    >
                      <span className="absolute left-0 top-0 h-full w-1.5" style={{ background: r.accent }} />
                      <div className="flex items-start gap-3 pl-1.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm" style={{ background: r.accent }}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="truncate font-black text-ink">{r.name}</h4>
                            <div className="shrink-0 text-right leading-none">
                              <span className="text-lg font-black" style={{ color: r.accent }}>{r.score.toFixed(1)}</span>
                              <span className="ml-0.5 text-[10px] font-semibold text-ink-muted">fit</span>
                            </div>
                          </div>
                          {/* colorful info chips */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-slate-200/70">📏 {r.distanceKm.toFixed(1)} km</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-slate-200/70">⏱ {fmtTime(r.minutes)}</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-slate-200/70">⛰ +{r.elevationM} m</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-slate-200/70">🛣 {r.surface}</span>
                            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold" style={{ background: `${r.accent}1a`, color: r.accent }}>{r.difficulty}</span>
                          </div>
                          {/* actions */}
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); openRoute(r) }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeWidth="1.7" /><circle cx="12" cy="12" r="2.5" strokeWidth="1.7" /></svg>
                              Details
                            </button>
                            <a href={directionsUrl(r.waypoints)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:border-brand-200 hover:text-brand-600">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5"><path d="M3 11l19-9-9 19-2-8-8-2z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                              Directions
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {visibleCount < results.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(results.length)}
                  className="btn-ghost w-full py-2.5"
                >
                  Show {results.length - visibleCount} more options
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
              {visibleCount >= results.length && results.length > 10 && (
                <button type="button" onClick={() => setVisibleCount(10)} className="btn-ghost w-full py-2">
                  Show fewer
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
