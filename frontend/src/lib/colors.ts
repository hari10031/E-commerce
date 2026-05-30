/** Shared color name → CSS hex for swatches across shop UI */

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
  indigo: '#4f46e5',
  burgundy: '#800020',
  wine: '#722f37',
  mustard: '#e1ad01',
  teal: '#008080',
  peach: '#ffcba4',
  olive: '#808000',
  emerald: '#50c878',
  turquoise: '#40e0d0',
  royal: '#4169e1',
  lavender: '#e6e6fa',
  magenta: '#ff00ff',
  plum: '#8e4585',
  violet: '#8f00ff',
  copper: '#b87333',
  bronze: '#cd7f32',
  rust: '#b7410e',
  coral: '#ff7f50',
  apricot: '#fbceb1',
  crimson: '#dc143c',
  khaki: '#c3b091',
  mint: '#98ff98',
  ivory: '#fffff0',
  'rose gold': '#e6b9a6',
  'white gold': '#f5f0e1',
  'polished gold': '#C9A227',
  'antique gold': '#b8860b',
  'traditional gold': '#C9A227',
  champagne: '#f7e7ce',
}

const DEFAULT_NEUTRAL = '#e5e7eb'

const SORTED_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)

export function resolveColorHex(color: string | undefined | null): string {
  if (!color) return DEFAULT_NEUTRAL

  const trimmed = color.trim()
  if (!trimmed) return DEFAULT_NEUTRAL

  if (trimmed.startsWith('#')) {
    return trimmed
  }

  if (/^[0-9A-Fa-f]{3}$/.test(trimmed) || /^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed}`
  }

  const lower = trimmed.toLowerCase()
  if (COLOR_MAP[lower]) {
    return COLOR_MAP[lower]
  }

  for (const key of SORTED_KEYS) {
    if (lower.includes(key)) {
      return COLOR_MAP[key]
    }
  }

  return DEFAULT_NEUTRAL
}

export function isLightColor(color: string | undefined | null): boolean {
  if (!color) return false
  const lower = color.toLowerCase()
  return ['white', 'cream', 'beige', 'silver', 'yellow', 'peach', 'lavender', 'ivory', 'champagne'].some(
    (c) => lower.includes(c)
  )
}
