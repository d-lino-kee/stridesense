'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Route discovery now lives inside the dashboard's "Plan your run" panel.
export default function DiscoverRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
}
