import { auth } from '@/firebase/client'

// Accept either NEXT_PUBLIC_API_BASE (used in .env.local) or the more explicit
// NEXT_PUBLIC_API_BASE_URL, falling back to the local FastAPI dev server.
const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:8000'

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken().catch(() => null)
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return (await res.json()) as T
}

export { BASE as API_BASE }
