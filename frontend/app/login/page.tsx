'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '@/providers/AuthProvider'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, user, router])

  async function signInGoogle() {
    setErr(null)
    setBusy(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.replace('/dashboard')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  const perks = [
    'Personalized route recommendations',
    '3D terrain previews & AI route summaries',
    'Your runs, routes & reviews kept in sync',
  ]

  return (
    <div className="container-page flex min-h-[82vh] items-center justify-center py-12">
      <div className="grid w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lift md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-8 text-white md:flex">
          <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:22px_22px] opacity-20" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl animate-float" />
          <div className="relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path d="M4 17c3-1 4-4 6-4s2 2 4 2 3-3 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-6 text-3xl font-black leading-tight">
              Every run,<br />measured to you.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-white/85">
              StrideSense learns your stride and finds the route that fits how you feel today.
            </p>
          </div>
          <ul className="relative mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-white/95">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3"><path d="M4 12l5 5L20 6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-in panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-6 md:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to keep your runs, routes, and recommendations in sync.
          </p>

          <button
            type="button"
            onClick={signInGoogle}
            disabled={busy}
            className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
            </svg>
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>

          {err && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

          <div className="mt-6 flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="h-px flex-1 bg-slate-200" />
            secured by Firebase Authentication
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
