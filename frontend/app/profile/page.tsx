'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '../providers/AuthProvider'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (!user) return null

  return (
    <div style={{ maxWidth: 720, margin: '64px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Profile</h1>

      <div style={{ border: '1px solid #e5e5e5', borderRadius: 16, padding: 16 }}>
        <p style={{ margin: 0 }}><b>Name:</b> {user.displayName ?? '—'}</p>
        <p style={{ margin: 0 }}><b>Email:</b> {user.email ?? '—'}</p>
        <p style={{ margin: 0 }}><b>User ID:</b> {user.uid}</p>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button onClick={() => router.push('/dashboard')} style={{ padding: '10px 14px', borderRadius: 12 }}>
          Go to Dashboard
        </button>

        <button
          onClick={async () => {
            await signOut(auth)
            router.replace('/login')
          }}
          style={{ padding: '10px 14px', borderRadius: 12 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
