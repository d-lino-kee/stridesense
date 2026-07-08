import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-xs text-ink-muted">
            Next.js · TypeScript · FastAPI · scikit-learn · Strava · Google Maps
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm text-ink-muted">
          <span>© {new Date().getFullYear()} StrideSense</span>
          <a href="#" className="hover:text-ink">
            Privacy
          </a>
          <a href="#" className="hover:text-ink">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
