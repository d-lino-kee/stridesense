'use client'

import { useMemo, useRef, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { terrainStats, type WaterlooRoute } from '@/data/waterlooRoutes'

type Mode = '3d' | 'profile'

// Build the extruded 3D ridge geometry from the elevation samples.
function useTerrain(route: WaterlooRoute) {
  return useMemo(() => {
    const el = route.elevation
    const min = Math.min(...el)
    const max = Math.max(...el)
    const span = Math.max(1, max - min)
    const W = 100
    const n = el.length
    // Normalised ridge points across the width (y: lower = higher elevation).
    const pts = el.map((e, i) => {
      const x = (i / (n - 1)) * W
      const h = ((e - min) / span) * 34 // ridge height range
      const y = 46 - h
      return { x, y, h }
    })
    const ridgeTop = pts.map((p) => `${p.x},${p.y}`).join(' ')
    // Front face polygon: ridge across, then down the sides to the base.
    const frontFace = `0,46 ${ridgeTop} 100,46`
    // Depth (top) face: ridge offset up-right to fake extrusion.
    const dx = 4
    const dy = -3
    const depthTop = pts.map((p) => `${p.x + dx},${p.y + dy}`).join(' ')
    const depthFace = `${ridgeTop} ${pts
      .slice()
      .reverse()
      .map((p) => `${p.x + dx},${p.y + dy}`)
      .join(' ')}`
    return { pts, ridgeTop, frontFace, depthFace, depthTop }
  }, [route])
}

export default function TerrainView({ route }: { route: WaterlooRoute }) {
  const [mode, setMode] = useState<Mode>('3d')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const geo = useTerrain(route)
  const stats = terrainStats(route)

  const profile = route.elevation.map((e, i) => ({
    km: Number(((i / (route.elevation.length - 1)) * route.distanceKm).toFixed(1)),
    elevation: e,
  }))

  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: -py * 8, y: px * 10 })
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-brand-500">
              <path d="M3 20l6-12 4 7 3-5 5 10z" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            Terrain preview
          </h3>
          <p className="text-xs text-ink-muted">See the climbs before you commit</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          {(['3d', 'profile'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 transition ${
                mode === m ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {m === '3d' ? '3D view' : 'Profile'}
            </button>
          ))}
        </div>
      </div>

      {mode === '3d' ? (
        <div
          ref={wrapRef}
          onMouseMove={onMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          className="relative h-64 bg-gradient-to-b from-sky-100 via-sky-50 to-white"
          style={{ perspective: '900px' }}
        >
          {/* Sun */}
          <div className="absolute right-8 top-6 h-12 w-12 animate-float rounded-full bg-amber-300/80 blur-[2px]" />
          <div className="absolute right-10 top-8 h-8 w-8 rounded-full bg-amber-200" />

          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: `rotateX(${52 + tilt.x}deg) rotateZ(0deg) translateY(6%)`, transformStyle: 'preserve-3d' }}
          >
            {/* receding ground grid */}
            <div className="absolute inset-x-0 bottom-0 top-1/3 bg-map-mesh bg-[length:22px_22px]" />
          </div>

          {/* Extruded ridge (SVG, in front) */}
          <div
            className="absolute inset-0 flex items-end transition-transform duration-200 ease-out"
            style={{ transform: `rotateX(${tilt.x * 0.4}deg) rotateY(${tilt.y}deg)` }}
          >
            <svg viewBox="0 0 104 50" preserveAspectRatio="none" className="h-[78%] w-full animate-fade-up">
              <defs>
                <linearGradient id={`front-${route.slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={route.accent} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={route.accent} stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id={`top-${route.slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
                  <stop offset="100%" stopColor={route.accent} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              {/* depth / top face */}
              <polygon points={geo.depthFace} fill={`url(#top-${route.slug})`} />
              {/* front face */}
              <polygon points={geo.frontFace} fill={`url(#front-${route.slug})`} />
              {/* ridge line */}
              <polyline
                points={geo.ridgeTop}
                fill="none"
                stroke="#ffffff"
                strokeWidth={0.7}
                strokeLinejoin="round"
                opacity={0.9}
              />
              {/* peak marker */}
              {(() => {
                const peak = geo.pts.reduce((a, b) => (b.y < a.y ? b : a), geo.pts[0])
                return (
                  <g>
                    <line x1={peak.x} y1={peak.y} x2={peak.x} y2={peak.y - 4} stroke="#0f172a" strokeWidth={0.4} />
                    <polygon
                      points={`${peak.x},${peak.y - 4} ${peak.x + 3},${peak.y - 3} ${peak.x},${peak.y - 2}`}
                      fill="#ef4444"
                    />
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* stat overlay */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
            <span className="chip bg-white/90 text-ink-soft shadow-card">Peak {stats.max} m</span>
            <span className="chip bg-white/90 text-ink-soft shadow-card">Relief {stats.relief} m</span>
            <span className="chip bg-white/90 text-ink-soft shadow-card">↑ {stats.gain} m gain</span>
          </div>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/5 px-2 py-1 text-[10px] font-medium text-ink-muted backdrop-blur">
            move to tilt ↕
          </span>
        </div>
      ) : (
        <div className="h-64 w-full px-2 py-4">
          <ResponsiveContainer>
            <AreaChart data={profile} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id={`elevfill-${route.slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={route.accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={route.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis
                dataKey="km"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit=" km"
              />
              <YAxis
                domain={[stats.min - 4, stats.max + 4]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit=" m"
                width={52}
              />
              <Tooltip
                formatter={(v: number) => [`${v} m`, 'Elevation']}
                labelFormatter={(l) => `${l} km`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  boxShadow: '0 8px 24px -12px rgba(15,23,42,0.25)',
                }}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke={route.accent}
                strokeWidth={2.5}
                fill={`url(#elevfill-${route.slug})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade guidance */}
      <div className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100 text-center">
        {[
          { label: 'Max grade', value: `${stats.maxGradePct}%` },
          { label: 'Total climb', value: `+${stats.gain} m` },
          { label: 'Surface', value: route.surface },
        ].map((s) => (
          <div key={s.label} className="bg-white px-2 py-3">
            <div className="text-sm font-bold text-ink">{s.value}</div>
            <div className="text-[11px] text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
