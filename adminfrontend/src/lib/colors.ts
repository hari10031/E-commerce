/** Shared color name → CSS hex for admin UI swatches */

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  white: '#ffffff',
  black: '#000000',
  grey: '#6b7280',
  gray: '#6b7280',
  brown: '#92400e',
  gold: '#C9A227',
  silver: '#C0C0C0',
  beige: '#f5f5dc',
  maroon: '#800000',
  navy: '#001f5b',
  cream: '#fffdd0',
  'rose gold': '#e6b9a6',
  'white gold': '#f5f0e1',
  'polished gold': '#C9A227',
  'antique gold': '#b8860b',
  'traditional gold': '#C9A227',
}

const DEFAULT_NEUTRAL = '#e5e7eb'
const SORTED_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)

export function resolveColorHex(color: string | undefined | null): string {
  if (!color) return DEFAULT_NEUTRAL
  const trimmed = color.trim()
  if (!trimmed) return DEFAULT_NEUTRAL
  if (trimmed.startsWith('#')) return trimmed
  if (/^[0-9A-Fa-f]{3}$/.test(trimmed) || /^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed}`
  }
  const lower = trimmed.toLowerCase()
  if (COLOR_MAP[lower]) return COLOR_MAP[lower]
  for (const key of SORTED_KEYS) {
    if (lower.includes(key)) return COLOR_MAP[key]
  }
  return DEFAULT_NEUTRAL
}
