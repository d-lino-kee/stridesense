'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '@/providers/AuthProvider'
import Logo from './Logo'
import Avatar from './Avatar'

export default function NavBar() {
  const { user, loading } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/login')
  }

  const firstName = user
    ? (user.displayName ?? user.email ?? 'Runner').split(/[\s@]/)[0]
    : ''
  const initial = (user?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
      {/* brand hairline */}
      <div className="h-[3px] w-full bg-brand-gradient" />
      <div className="border-b border-slate-200/60">
        <nav className="container-page flex h-16 items-center justify-between">
          <Logo />

          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-slate-100" />
            ) : user ? (
              <>
                {/* profile chip */}
                <Link
                  href="/profile"
                  className="group flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 py-1 pl-1 pr-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
                >
                  <Avatar src={user.photoURL} initial={initial} size={30} status />
                  <span className="hidden text-sm font-semibold text-ink-soft transition-colors group-hover:text-ink sm:block">
                    {firstName}
                  </span>
                </Link>

                {/* sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="group relative flex h-9 items-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-white pl-3.5 pr-3.5 text-sm font-semibold text-ink-muted shadow-sm transition-all hover:border-red-200 hover:text-red-600 hover:shadow-card"
                >
                  {/* red wash sweeps in on hover */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-red-50 transition-transform duration-300 group-hover:translate-x-0" />
                  <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0">
                      <path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute h-4 w-4 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="relative hidden sm:block">Sign out</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary px-5 py-2">
                Log in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
