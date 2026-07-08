'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '@/providers/AuthProvider'
import Logo from './Logo'

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
      }`}
    >
      {label}
    </Link>
  )
}

export default function NavBar() {
  const { user, loading } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <div className="ml-3 hidden items-center gap-1 sm:flex">
            <NavLink href="/dashboard" label="Dashboard" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm font-medium text-ink-soft transition hover:border-slate-300 sm:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                  {(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </span>
                Profile
              </Link>
              <button type="button" onClick={handleSignOut} className="btn-ghost px-3 py-1.5">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary px-4 py-1.5">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
