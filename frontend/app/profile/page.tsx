'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '@/providers/AuthProvider'
import Page from '@/components/Page'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    )
  }

  const initial = (user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()

  return (
    <Page title="Profile" subtitle="Your account and connected data.">
      <div className="max-w-2xl">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 bg-brand-gradient p-6 text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              {initial}
            </span>
            <div>
              <h2 className="text-xl font-bold">{user.displayName ?? 'Runner'}</h2>
              <p className="text-sm text-white/80">{user.email ?? '—'}</p>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 p-6">
            {[
              ['Name', user.displayName ?? '—'],
              ['Email', user.email ?? '—'],
              ['User ID', user.uid],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="max-w-[60%] truncate text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-primary px-5 py-2.5"
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut(auth)
              router.replace('/login')
            }}
            className="btn-ghost px-5 py-2.5"
          >
            Sign out
          </button>
        </div>
      </div>
    </Page>
  )
}
