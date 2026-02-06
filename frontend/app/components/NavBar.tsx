'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

export default function NavBar() {
  const { user, loading } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) return null

  return (
    <header
      style={{
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
      }}
    >
      <nav
        style={{
          maxWidth: 1152,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Left side */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 18 }}>
            StrideSense
          </Link>

          <Link href="/dashboard">Dashboard</Link>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/profile">Profile</Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'none',
                  border: '1px solid #e5e7eb',
                  padding: '6px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </nav>
    </header>
  )
}
