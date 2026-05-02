import type { DFlowEvent, Market } from './types'

export function getPrimaryMarket(event: DFlowEvent): Market | null {
  const markets = event.markets ?? []
  if (markets.length === 0) return null

  const initialized = markets.filter((m) =>
    Object.values(m.accounts ?? {}).some((a) => a.isInitialized)
  )

  const pool = initialized.length > 0 ? initialized : markets
  return pool.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0] ?? null
}

export function getPrice(
  ask: string | null | undefined,
  bid: string | null | undefined
): number | null {
  const raw = ask ?? bid
  if (!raw) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

export function hasLiquidity(event: DFlowEvent): boolean {
  const m = getPrimaryMarket(event)
  if (!m) return false
  return (
    getPrice(m.yesAsk, m.yesBid) !== null ||
    getPrice(m.noAsk, m.noBid) !== null
  )
}
