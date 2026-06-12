/**
 * Layer 0 — performance baseline audit.
 * Run with backend (+ optional frontend) dev servers up.
 *
 *   cd backend && npm run perf:baseline
 *   cd backend && npm run perf:baseline:lighthouse
 */
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const API_URL = process.env.API_URL ?? 'http://localhost:4000'
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'
const ADMIN_URL = process.env.ADMIN_URL ?? 'http://localhost:3001'
const RUNS = Number.parseInt(process.env.PERF_RUNS ?? '5', 10)
const WITH_LIGHTHOUSE =
  process.argv.includes('lighthouse') || process.env.PERF_LIGHTHOUSE === '1'

type Threshold = { good: number; warn: number; unit: string }
type Sample = { ok: boolean; status: number; ttfbMs: number; totalMs: number; bytes: number }

type EndpointResult = {
  name: string
  url: string
  reachable: boolean
  samples: number
  ttfb: { min: number; p50: number; p95: number; max: number }
  total: { min: number; p50: number; p95: number; max: number }
  threshold: Threshold
  grade: 'good' | 'warn' | 'bad' | 'skip'
}

const API_THRESHOLDS: Record<string, Threshold> = {
  health: { good: 50, warn: 150, unit: 'ms' },
  categories: { good: 150, warn: 400, unit: 'ms' },
  products_list: { good: 200, warn: 500, unit: 'ms' },
  products_search: { good: 250, warn: 600, unit: 'ms' },
  product_detail: { good: 200, warn: 500, unit: 'ms' },
}

const WEB_THRESHOLDS: Threshold = { good: 400, warn: 1200, unit: 'ms' }

const API_ENDPOINTS = [
  { name: 'health', path: '/health' },
  { name: 'categories', path: '/api/categories' },
  { name: 'products_list', path: '/api/products?published=true&limit=20&page=1' },
  { name: 'products_search', path: '/api/products?search=saree&published=true&limit=20' },
]

const WEB_PAGES = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products' },
  { name: 'cart', path: '/cart' },
]

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    min: sorted[0] ?? 0,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1] ?? 0,
  }
}

function gradeFromThreshold(p95: number, threshold: Threshold): 'good' | 'warn' | 'bad' {
  if (p95 <= threshold.good) return 'good'
  if (p95 <= threshold.warn) return 'warn'
  return 'bad'
}

async function fetchSample(url: string): Promise<Sample> {
  const start = performance.now()
  let ttfbMs = 0
  let bytes = 0

  try {
    const res = await fetch(url, { cache: 'no-store' })
    ttfbMs = performance.now() - start
    const body = await res.arrayBuffer()
    bytes = body.byteLength
    return {
      ok: res.ok,
      status: res.status,
      ttfbMs,
      totalMs: performance.now() - start,
      bytes,
    }
  } catch {
    return { ok: false, status: 0, ttfbMs: 0, totalMs: performance.now() - start, bytes: 0 }
  }
}

async function benchmarkUrl(
  name: string,
  url: string,
  threshold: Threshold,
  runs: number
): Promise<EndpointResult> {
  const ttfbSamples: number[] = []
  const totalSamples: number[] = []
  let reachable = false

  for (let i = 0; i < runs; i++) {
    const sample = await fetchSample(url)
    if (sample.status > 0) reachable = true
    if (sample.ok || sample.status === 401) {
      ttfbSamples.push(sample.ttfbMs)
      totalSamples.push(sample.totalMs)
    }
  }

  const ttfb = stats(ttfbSamples)
  const total = stats(totalSamples)
  const grade =
    ttfbSamples.length === 0 ? 'skip' : gradeFromThreshold(total.p95, threshold)

  return {
    name,
    url,
    reachable,
    samples: ttfbSamples.length,
    ttfb,
    total,
    threshold,
    grade,
  }
}

async function resolveProductDetailPath(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/products?published=true&limit=1`)
    if (!res.ok) return null
    const data = (await res.json()) as { data?: { id?: string }[] }
    const id = data.data?.[0]?.id
    return id ? `/api/products/${id}` : null
  } catch {
    return null
  }
}

async function checkLayer1Headers(): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  try {
    const categories = await fetch(`${API_URL}/api/categories`)
    out.categoriesCacheControl = categories.headers.get('cache-control')
    const products = await fetch(`${API_URL}/api/products?published=true&limit=1`)
    out.productsCacheControl = products.headers.get('cache-control')
    const health = await fetch(`${API_URL}/health`)
    const healthJson = (await health.json()) as { cdn?: string }
    out.cdnStatus = healthJson.cdn ?? null
  } catch {
    out.error = 'API unreachable'
  }
  return out
}

async function warmupFrontend(): Promise<boolean> {
  let reachable = false
  for (const page of WEB_PAGES) {
    try {
      const res = await fetch(`${FRONTEND_URL}${page.path}`, { cache: 'no-store' })
      if (res.status > 0) reachable = true
    } catch {
      // frontend down
    }
  }
  return reachable
}

async function resolveSampleImageUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/products?published=true&limit=1`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      data?: { images?: { url: string }[]; image_url?: string }[]
    }
    const product = data.data?.[0]
    return product?.images?.[0]?.url ?? product?.image_url ?? null
  } catch {
    return null
  }
}

function printRow(label: string, result: EndpointResult) {
  const icon =
    result.grade === 'good' ? 'OK' : result.grade === 'warn' ? 'WARN' : result.grade === 'bad' ? 'BAD' : 'SKIP'
  if (!result.reachable) {
    console.log(`[SKIP] ${label.padEnd(18)} unreachable`)
    return
  }
  console.log(
    `[${icon}]  ${label.padEnd(18)} total p95=${result.total.p95.toFixed(0)}ms  ttfb p95=${result.ttfb.p95.toFixed(0)}ms  (good<${result.threshold.good} warn<${result.threshold.warn})`
  )
}

function runLighthouse(url: string, outDir: string, label: string): void {
  const outFile = resolve(outDir, `lighthouse-${label}.json`)
  console.log(`\nLighthouse: ${url}`)
  try {
    execSync(
      `npx --yes lighthouse "${url}" --only-categories=performance --form-factor=mobile --quiet --chrome-flags="--headless --no-sandbox" --output=json --output-path="${outFile}"`,
      { stdio: 'inherit', timeout: 120_000 }
    )
    console.log(`  saved ${outFile}`)
  } catch (err) {
    console.log(`  Lighthouse failed for ${label} (Chrome required). Skip or install Chrome.`)
  }
}

async function main() {
  const repoRoot = join(__dirname, '../..')
  const reportDir = resolve(repoRoot, 'perf-reports')
  mkdirSync(reportDir, { recursive: true })

  console.log('Layer 0 — performance baseline\n')
  console.log(`API:      ${API_URL}`)
  console.log(`Frontend: ${FRONTEND_URL}`)
  console.log(`Runs:     ${RUNS} per endpoint\n`)

  const apiResults: EndpointResult[] = []

  for (const ep of API_ENDPOINTS) {
    const result = await benchmarkUrl(
      ep.name,
      `${API_URL}${ep.path}`,
      API_THRESHOLDS[ep.name] ?? { good: 200, warn: 500, unit: 'ms' },
      RUNS
    )
    apiResults.push(result)
    printRow(ep.name, result)
  }

  const detailPath = await resolveProductDetailPath()
  if (detailPath) {
    const result = await benchmarkUrl(
      'product_detail',
      `${API_URL}${detailPath}`,
      API_THRESHOLDS.product_detail,
      RUNS
    )
    apiResults.push(result)
    printRow('product_detail', result)
  } else {
    console.log('[SKIP] product_detail     no published products')
  }

  const layer1 = await checkLayer1Headers()
  console.log('\nLayer 1 headers:')
  console.log(`  categories Cache-Control: ${layer1.categoriesCacheControl ?? 'missing'}`)
  console.log(`  products   Cache-Control: ${layer1.productsCacheControl ?? 'missing'}`)
  console.log(`  CDN status (health):    ${layer1.cdnStatus ?? 'unknown'}`)

  console.log('\nWeb pages (HTML TTFB, post-warmup — dev compile excluded):')
  const frontendUp = await warmupFrontend()
  if (!frontendUp) {
    console.log('  frontend unreachable — start with: cd frontend && npm run dev')
  }
  const webResults: EndpointResult[] = []
  for (const page of WEB_PAGES) {
    const result = await benchmarkUrl(
      page.name,
      `${FRONTEND_URL}${page.path}`,
      WEB_THRESHOLDS,
      Math.min(RUNS, 3)
    )
    webResults.push(result)
    printRow(page.name, result)
  }

  console.log('\nImage sample:')
  const imageUrl = await resolveSampleImageUrl()
  let imageResult: EndpointResult | null = null
  if (imageUrl) {
    imageResult = await benchmarkUrl('product_image', imageUrl, { good: 200, warn: 800, unit: 'ms' }, RUNS)
    printRow('product_image', imageResult)
  } else {
    console.log('[SKIP] product_image      no image URL from API')
  }

  const targets = {
    lcp: { good: 2500, warn: 4000, unit: 'ms' },
    cls: { good: 0.1, warn: 0.25, unit: '' },
    tbt: { good: 200, warn: 600, unit: 'ms' },
    apiP95: { good: 300, warn: 500, unit: 'ms' },
    scrollFps: { good: 55, warn: 45, unit: 'fps' },
  }

  const report = {
    layer: 0,
    measuredAt: new Date().toISOString(),
    config: { API_URL, FRONTEND_URL, ADMIN_URL, RUNS },
    targets,
    api: apiResults,
    web: webResults,
    image: imageResult,
    manualChecks: [
      'Mobile: enable Perf Monitor in dev menu on release APK — scroll product grid, target 55+ fps',
      'Chrome DevTools → Performance → record product list scroll — check long tasks < 50ms',
      'Chrome DevTools → Network → Fast 3G — repeat this script, compare p95',
      'Supabase Dashboard → Database → Query performance — note queries > 100ms',
      `Admin: ${ADMIN_URL}/dashboard — skeleton visible < 50ms on route change`,
    ],
    layer1,
    nextLayer: 'Layer 2 — Redis hot cache + home aggregate endpoint',
  }

  const reportPath = resolve(reportDir, 'baseline-latest.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  const badCount = [...apiResults, ...webResults, ...(imageResult ? [imageResult] : [])].filter(
    (r) => r.grade === 'bad'
  ).length
  const warnCount = [...apiResults, ...webResults, ...(imageResult ? [imageResult] : [])].filter(
    (r) => r.grade === 'warn'
  ).length

  console.log(`\nReport: ${reportPath}`)
  console.log(`Summary: ${badCount} bad, ${warnCount} warn`)
  console.log('\nManual checks (mobile + Lighthouse + Supabase):')
  for (const line of report.manualChecks) {
    console.log(`  • ${line}`)
  }

  if (WITH_LIGHTHOUSE) {
    for (const page of WEB_PAGES) {
      runLighthouse(`${FRONTEND_URL}${page.path}`, reportDir, page.name)
    }
  } else {
    console.log('\nTip: npm run perf:baseline:lighthouse  (needs Chrome)')
  }

  process.exit(badCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
