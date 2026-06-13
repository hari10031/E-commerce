const DEFAULT_API = 'http://localhost:4000'

/** Strip accidental comma-separated env values; pick best candidate per runtime. */
function resolveApiUrl(raw: string | undefined, fallback: string): string {
  const candidates = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (candidates.length === 0) return fallback
  if (typeof window === 'undefined') {
    const loopback = candidates.find(
      (u) => u.includes('127.0.0.1') || u.includes('localhost')
    )
    return loopback ?? candidates[0] ?? fallback
  }
  const https = candidates.find((u) => u.startsWith('https://'))
  return https ?? candidates[0] ?? fallback
}

const PUBLIC_API = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API)

/** SSR on same EC2 as API — use loopback to skip nginx/SSL hairpin. */
function apiBase(): string {
  if (typeof window === 'undefined') {
    return resolveApiUrl(process.env.API_URL, PUBLIC_API)
  }
  return PUBLIC_API
}

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
      const res = await fetch(`${PUBLIC_API}/api/auth/refresh`, {
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

function cacheOptions(path: string, method: string, token?: string): RequestInit {
  if (token || method !== 'GET') {
    return { cache: 'no-store' }
  }
  const privatePaths = ['/api/cart', '/api/wishlist', '/api/orders', '/api/auth', '/api/addresses']
  if (privatePaths.some((p) => path.startsWith(p))) {
    return { cache: 'no-store' }
  }
  if (path.startsWith('/api/categories')) {
    return { next: { revalidate: 300 } }
  }
  if (path.startsWith('/api/products')) {
    return { next: { revalidate: 60 } }
  }
  return { next: { revalidate: 60 } }
}

async function request<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...init } = options ?? {}
  const method = init.method ?? 'GET'

  function doFetch(authToken?: string) {
    return fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
      ...cacheOptions(path, method, authToken ?? token),
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
