export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T | { __mock: true }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })

    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as T
  } catch (e) {
    console.warn('apiFetch mock fallback:', (e as Error).message)
    return { __mock: true }
  }
}
