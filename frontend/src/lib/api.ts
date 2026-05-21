const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// Shared in-flight refresh so concurrent 401s trigger only one refresh call.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const { useAuthStore } = await import('@/store/authStore')
    const { refreshToken, user, setAuth, clearAuth } = useAuthStore.getState()
    if (!refreshToken) {
      clearAuth()
      return null
    }
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        clearAuth()
        return null
      }
      const data = (await res.json()) as { token: string; refreshToken: string }
      if (user) setAuth(data.token, data.refreshToken, user)
      return data.token
    } catch {
      clearAuth()
      return null
    }
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function request<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...init } = options ?? {}

  function doFetch(authToken?: string) {
    return fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
      next: { revalidate: 0 },
    })
  }

  let res = await doFetch(token)

  // Access token expired — refresh once and retry (client-side only).
  if (res.status === 401 && token && typeof window !== 'undefined') {
    const newToken = await refreshAccessToken()
    if (newToken) res = await doFetch(newToken)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json()
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
}
