import Link from 'next/link'
import Logo from './Logo'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'Log in', href: '/login' },
    ],
  },
  {
    title: 'Routes',
    links: [
      { label: 'Ring Road Loop', href: '/routes/ring-road-loop' },
      { label: 'Laurel Creek Trail', href: '/routes/laurel-creek-trail' },
      { label: 'Iron Horse Trail', href: '/routes/iron-horse-trail' },
    ],
  },
]

const stack = ['Next.js', 'TypeScript', 'FastAPI', 'scikit-learn', 'Strava', 'Google Maps']

export default function Footer() {
  return (
    <footer className="mt-16">
      <div className="h-[3px] w-full bg-brand-gradient opacity-80" />
      <div className="border-t border-slate-200 bg-white">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Personalized running recommendations for the Waterloo Region — powered by machine
              learning, terrain data, and your own stride.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {stack.map((s) => (
                <span key={s} className="chip bg-slate-100 text-ink-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-ink-muted transition hover:text-brand-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100">
          <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-sm text-ink-muted sm:flex-row">
            <span>© {new Date().getFullYear()} StrideSense. Built for runners.</span>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-ink">Privacy</a>
              <a href="#" className="hover:text-ink">Terms</a>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All systems normal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
