import type { NextConfig } from 'next'
import path from 'path'

function cdnImagePattern() {
  const cdn = process.env.NEXT_PUBLIC_STORAGE_CDN_URL
  if (!cdn) return null
  try {
    const { hostname } = new URL(cdn)
    return { protocol: 'https' as const, hostname, pathname: '/**' }
  } catch {
    return null
  }
}

const cdnPattern = cdnImagePattern()

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384, 512],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(cdnPattern ? [cdnPattern] : []),
    ],
  },
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
}
export default nextConfig
