/** "0.6100" string or 6100 int → 0.61 float, or null. */
export function priceToFloat(p: string | number | null | undefined): number | null {
  if (p == null) return null
  if (typeof p === 'string') {
    const n = parseFloat(p)
    return Number.isFinite(n) ? n : null
  }
  // Integer 0–10000 scale
  if (p > 1) return p / 10000
  return p
}

/** 0.61 → "61%" */
export function pct(p: number | null | undefined): string {
  if (p == null) return '—'
  return `${Math.round(p * 100)}%`
}

/** 0.61 → "61¢" */
export function cents(p: number | null | undefined): string {
  if (p == null) return '—'
  return `${Math.round(p * 100)}¢`
}

/** 1234567 → "$1.23M" */
export function shortMoney(n: number | null | undefined): string {
  if (n == null || n === 0) return '$0'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

/** Unix seconds → "Closes in 3d" or "Closed". null/0 → "—". */
export function closesIn(unixSec: number | null | undefined): string {
  if (!unixSec) return '—'
  const ms = unixSec * 1000 - Date.now()
  if (ms < 0) return 'Closed'
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  if (days > 0) return `Closes in ${days}d`
  if (hours > 0) return `Closes in ${hours}h`
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  return `Closes in ${mins}m`
}
