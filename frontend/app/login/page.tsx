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

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to keep your runs, routes, and recommendations in sync.
          </p>

          <button
            type="button"
            onClick={signInGoogle}
            disabled={busy}
            className="btn-ghost mt-6 w-full justify-center py-3"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
              />
            </svg>
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>

          {err && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        </div>
        <p className="mt-4 text-center text-xs text-ink-muted">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
