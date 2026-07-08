import Link from 'next/link'

const features = [
  {
    title: 'Route suitability model',
    body: 'A scikit-learn RandomForest scores every candidate route against your fitness, pace trends, and terrain preferences.',
    icon: (
      <path d="M3 12l4-4 4 4 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Strava + Google Maps',
    body: 'Import your activity history from Strava and enrich routes with Google Maps directions and elevation data.',
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
    title: 'Adapts as you run',
    body: 'The model retrains on your logged runs, so recommendations get sharper the more you use StrideSense.',
    icon: (
      <path
        d="M4 4v6h6 M20 20v-6h-6 M20 10a8 8 0 00-14-3 M4 14a8 8 0 0014 3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-grid [background-size:24px_24px]" />
        <div className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="chip bg-brand-50 text-brand-700">Multi-framework ML platform</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Run smarter with{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                personalized routes.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              StrideSense pairs your Strava history and Google Maps terrain data with a scikit-learn
              suitability model — then recommends the run that fits how you feel today.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn-primary px-5 py-3 text-base">
                Open the dashboard
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/login" className="btn-ghost px-5 py-3 text-base">
                Log in with Google
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                ['4', 'ML feature groups'],
                ['2', 'API integrations'],
                ['10/10', 'suitability scale'],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-bold text-ink">{n}</dt>
                  <dd className="text-xs text-ink-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Preview card */}
          <div className="animate-fade-up lg:justify-self-end">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="chip bg-slate-100 text-ink-soft">Today’s pick</span>
                <span className="chip bg-brand-50 text-brand-700">Suitability 8.4</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">Lake Loop</h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ['8.2 km', 'distance'],
                  ['+120 m', 'elevation'],
                  ['3/10', 'soreness'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-slate-50 p-3 text-center">
                    <div className="text-sm font-bold text-ink">{v}</div>
                    <div className="text-[11px] text-ink-muted">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[84%] rounded-full bg-brand-gradient" />
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                Picked for a light day — moderate distance and rolling elevation matched to your
                recent pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
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
    </div>
  )
}
