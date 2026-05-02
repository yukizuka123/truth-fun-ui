import { CurveState } from './math'

export interface BonusPoolState {
  balance: number
  totalVolume: number
  winningTokensOutstanding: number
}

export interface RedemptionReserveState {
  reserveBalance: number
  hourlyCapBps: number
  redemptionFeeBps: number
  hourlyUsedPct: number
  twapPrice: number
  oracleStale: boolean
}

const STUB_CURVE_STATES: Record<string, CurveState> = {
  'elon-btc-15min-001': { x: 600, y: 546, k: 327600 },
  'btc-100k-daily-001': { x: 3100, y: 2201, k: 6823100 },
  'eth-5k-weekly-001': { x: 11500, y: 5175, k: 59512500 },
}

const STUB_BONUS_POOLS: Record<string, BonusPoolState> = {
  'elon-btc-15min-001': { balance: 86, totalVolume: 8600, winningTokensOutstanding: 10000 },
  'btc-100k-daily-001': { balance: 420, totalVolume: 42000, winningTokensOutstanding: 25000 },
  'eth-5k-weekly-001': { balance: 1800, totalVolume: 180000, winningTokensOutstanding: 80000 },
}

export async function getBondingCurveState(marketId: string): Promise<CurveState> {
  return STUB_CURVE_STATES[marketId] ?? { x: 1200, y: 600, k: 720000 }
}

export async function getBonusPoolState(marketId: string): Promise<BonusPoolState> {
  return STUB_BONUS_POOLS[marketId] ?? { balance: 0, totalVolume: 0, winningTokensOutstanding: 10000 }
}

export async function getRedemptionReserveState(marketId: string): Promise<RedemptionReserveState> {
  return {
    reserveBalance: 120,
    hourlyCapBps: 500,
    redemptionFeeBps: 50,
    hourlyUsedPct: 3.2,
    twapPrice: 0.62,
    oracleStale: false,
  }
}

export async function buyCurve(params: {
  marketId: string
  usdcIn: number
  minTokensOut: number
}): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500))
  const sig = 'SimTx' + Math.random().toString(36).slice(2, 10).toUpperCase()

  const state = STUB_CURVE_STATES[params.marketId]
  if (state) {
    const newY = state.y + params.usdcIn
    const newX = state.k / newY
    state.y = newY
    state.x = newX
  }

  const bp = STUB_BONUS_POOLS[params.marketId]
  if (bp) {
    bp.balance += params.usdcIn * 0.01
    bp.totalVolume += params.usdcIn
  }

  return sig
}

export async function sellCurve(params: {
  marketId: string
  tokensIn: number
  minUsdcOut: number
}): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500))
  const sig = 'SimTx' + Math.random().toString(36).slice(2, 10).toUpperCase()

  const state = STUB_CURVE_STATES[params.marketId]
  if (state) {
    const newX = state.x + params.tokensIn
    const newY = state.k / newX
    const usdcOut = state.y - newY
    state.x = newX
    state.y = newY
    const bp = STUB_BONUS_POOLS[params.marketId]
    if (bp) {
      bp.balance += usdcOut * 0.01
      bp.totalVolume += usdcOut
    }
  }

  return sig
}

export async function redeemFromReserve(params: {
  marketId: string
  tokensIn: number
  minUsdcOut: number
}): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500))
  return 'SimTx' + Math.random().toString(36).slice(2, 10).toUpperCase()
}

export async function claimPayout(marketId: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500))
  return 'SimTx' + Math.random().toString(36).slice(2, 10).toUpperCase()
}
