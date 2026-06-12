/**
 * Rewrite Supabase storage URLs to CDN origin when STORAGE_CDN_URL is set.
 * Point Cloudflare (or similar) at your Supabase storage public path.
 */
const CDN_BASE = process.env.STORAGE_CDN_URL?.replace(/\/$/, '')

function storagePrefix(): string | null {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
  if (!supabaseUrl) return null
  return `${supabaseUrl}/storage/v1/object/public`
}

export function isCdnConfigured(): boolean {
  return Boolean(CDN_BASE && storagePrefix())
}

export function toCdnUrl(url: string | null | undefined): string | null | undefined {
  if (!url || !CDN_BASE) return url ?? undefined
  const prefix = storagePrefix()
  if (!prefix || !url.startsWith(prefix)) return url
  return `${CDN_BASE}${url.slice(prefix.length)}`
}

type ImageRow = { url?: string | null }
type VariantRow = { image_url?: string | null }
type CategoryRow = { image_url?: string | null }
type ProductRow = {
  images?: ImageRow[] | null
  variants?: VariantRow[] | null
}

export function mapCategoryCdn<T extends CategoryRow>(row: T): T {
  if (!row.image_url) return row
  return { ...row, image_url: toCdnUrl(row.image_url) ?? row.image_url }
}

export function mapProductCdn<T extends ProductRow>(product: T): T {
  const images = product.images?.map((img) =>
    img.url ? { ...img, url: toCdnUrl(img.url) ?? img.url } : img
  )
  const variants = product.variants?.map((v) =>
    v.image_url ? { ...v, image_url: toCdnUrl(v.image_url) ?? v.image_url } : v
  )
  return { ...product, ...(images ? { images } : {}), ...(variants ? { variants } : {}) }
}
