import type { Response } from 'express'

/** Public catalog responses — safe for CDN / browser cache. */
export function setPublicCache(
  res: Response,
  maxAgeSeconds: number,
  staleWhileRevalidateSeconds?: number
): void {
  const swr = staleWhileRevalidateSeconds ?? Math.max(30, Math.floor(maxAgeSeconds / 2))
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${swr}`)
}

/** Authed or mutable data — never cache at edge. */
export function setPrivateNoStore(res: Response): void {
  res.setHeader('Cache-Control', 'private, no-store')
}
