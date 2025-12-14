'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace('/profile')
  }, [loading, user, router])

  async function signInGoogle() {
    setErr(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.replace('/profile')
    } catch (e: any) {
      setErr(e?.message ?? 'Sign-in failed')
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '64px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Log in</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Sign in to keep your runs, routes, and recommendations private.
      </p>

      <button onClick={signInGoogle} style={{ padding: '10px 14px', borderRadius: 12 }}>
        Continue with Google
      </button>

      {err && <p style={{ color: 'crimson', marginTop: 12 }}>{err}</p>}
    </div>
  )
}
