export interface CurveState {
  x: number
  y: number
  k: number
}

export function spotPrice(state: CurveState): number {
  return state.y / state.x
}

export function buyQuote(
  state: CurveState,
  usdcIn: number
): { tokensOut: number; newPrice: number; priceImpact: number } {
  const oldPrice = spotPrice(state)
  const newY = state.y + usdcIn
  const newX = state.k / newY
  const tokensOut = state.x - newX
  const newPrice = newY / newX
  const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100
  return { tokensOut, newPrice, priceImpact }
}

export function sellQuote(
  state: CurveState,
  tokensIn: number
): { usdcOut: number; newPrice: number; priceImpact: number } {
  const oldPrice = spotPrice(state)
  const newX = state.x + tokensIn
  const newY = state.k / newX
  const usdcOut = state.y - newY
  const newPrice = newY / newX
  const priceImpact = ((oldPrice - newPrice) / oldPrice) * 100
  return { usdcOut, newPrice, priceImpact }
}

export function bonusPerToken(bonusPool: number, winningTokens: number): number {
  if (winningTokens === 0) return 0
  return bonusPool / winningTokens
}

export function effectiveReturn(bonusPerTok: number, entryPrice: number): number {
  if (entryPrice === 0) return 0
  return (1.0 + bonusPerTok) / entryPrice
}

export function calcBonusPool(
  totalVolume: number,
  totalArbVolume: number,
  avgSpread: number
): number {
  return totalVolume * 0.01 + totalArbVolume * avgSpread * 0.2
}

export type MarketPhase = 'EARLY' | 'MID' | 'LATE' | 'FOG'

export function getMarketPhase(progressPct: number, fogActive: boolean): MarketPhase {
  if (fogActive) return 'FOG'
  if (progressPct <= 25) return 'EARLY'
  if (progressPct <= 75) return 'MID'
  return 'LATE'
}

export function timeRemainingLabel(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export function progressPercent(endsAt: string, durationMs: number): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  const elapsed = durationMs - diff
  return Math.min(100, Math.max(0, (elapsed / durationMs) * 100))
}
