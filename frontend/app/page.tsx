import Link from 'next/link'

const features = [
  {
    title: 'Route suitability model',
    body: 'A scikit-learn RandomForest scores every candidate route against your fitness, pace trends, and terrain preferences.',
    accent: '#f96316',
    icon: <path d="M3 12l4-4 4 4 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Traced on Google Maps',
    body: 'Every route is drawn turn-by-turn on the map, with a 3D terrain preview so you know the climbs before you lace up.',
    accent: '#2563eb',
    icon: (
      <path
        d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z M12 11a2 2 0 100-4 2 2 0 000 4z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'AI route previews',
    body: 'A language model describes what each run will look and feel like — footing, climbs, and the sensations to expect.',
    accent: '#8b5cf6',
    icon: (
      <path
        d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5 10.1 10.9 5.5 9l4.6-1.4L12 3z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
]

const steps = [
  { n: '01', title: 'Tell us how you feel', body: 'Pick a vibe — jog, light, mid or long — and your elevation mood.' },
  { n: '02', title: 'The model ranks routes', body: 'Your history and today’s context score every nearby route in real time.' },
  { n: '03', title: 'Run the perfect match', body: 'Get a traced map, terrain preview, AI summary and predicted soreness.' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-brand-mesh" />
        <div className="absolute inset-0 -z-10 bg-hero-grid [background-size:24px_24px] opacity-60" />
        <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-brand-gradient opacity-20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />

        <div className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Multi-framework ML platform · Waterloo Region
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Run smarter with{' '}
              <span className="gradient-text">personalized routes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              StrideSense pairs your Strava history and Google Maps terrain data with a scikit-learn
              suitability model — then recommends the run that fits how you feel today.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn-primary px-5 py-3 text-base">
                Open the dashboard
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/login" className="btn-ghost px-5 py-3 text-base">
                Log in with Google
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                ['6', 'routes near UW'],
                ['3D', 'terrain previews'],
                ['10/10', 'suitability scale'],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-black text-ink">{n}</dt>
                  <dd className="text-xs text-ink-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Preview card */}
          <div className="animate-fade-up lg:justify-self-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-2xl" />
              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lift backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="chip bg-slate-100 text-ink-soft">Today’s pick</span>
                  <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">Suitability 8.3</span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">Laurel Creek Trail</h3>
                <p className="text-xs text-ink-muted">Laurel Creek C.A. · gravel trail</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    ['6.8 km', 'distance'],
                    ['+96 m', 'elevation'],
                    ['5/10', 'soreness'],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-slate-50 p-3 text-center">
                      <div className="text-sm font-bold text-ink">{v}</div>
                      <div className="text-[11px] text-ink-muted">{l}</div>
                    </div>
                  ))}
                </div>
                {/* faux elevation sparkline */}
                <svg viewBox="0 0 100 26" className="mt-4 h-12 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f96316" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f96316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points="0,26 0,16 15,10 30,4 45,12 60,7 75,15 90,9 100,13 100,26" fill="url(#spark)" />
                  <polyline points="0,16 15,10 30,4 45,12 60,7 75,15 90,9 100,13" fill="none" stroke="#f96316" strokeWidth="1.6" />
                </svg>
                <p className="mt-3 text-sm text-ink-soft">
                  Picked for a moderate day — rolling gravel matched to your recent pace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-8">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-10">
          <div className="text-center">
            <span className="chip bg-brand-50 text-brand-700">How it works</span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
              From a feeling to the perfect run in seconds
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.n} className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <span className="text-3xl font-black text-brand-200">{s.n}</span>
                <h3 className="mt-2 text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{s.body}</p>
                {i < steps.length - 1 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-brand-300 md:block">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition group-hover:opacity-20"
                style={{ background: f.accent }}
              />
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: f.accent }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="container-page pb-16 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 text-center shadow-glow sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:22px_22px] opacity-20" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl animate-float" />
          <div className="relative">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Ready to find your next run?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-white/85">
              Sign in with Google and StrideSense will start learning your stride from run one.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-brand-700 shadow-lift transition hover:-translate-y-0.5"
            >
              Get started free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
