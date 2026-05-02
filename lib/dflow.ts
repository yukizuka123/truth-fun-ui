/**
 * truth.fun adapter layer — maps DFlow API types to truth.fun UI types.
 * Components import from here, never from lib/dflow/* directly.
 * When NEXT_PUBLIC_DFLOW_STUB=true, falls back to hardcoded stub data.
 */

import { USDC_MINT } from './dflow/config'
import { getEvents, getMarket as dflowGetMarket } from './dflow/metadataClient'
import type { Market as DFlowMarket } from './dflow/types'

export const IS_STUB = process.env.NEXT_PUBLIC_DFLOW_STUB === 'true'

// ─── truth.fun types ─────────────────────────────────────────────────────────

export type MarketType = 'TRUTH_SPRINT' | 'DAILY' | 'WEEKLY'
export type MarketStatus = 'ACTIVE' | 'RESOLVING' | 'DETERMINED' | 'SETTLED'

export interface Market {
  id: string
  question: string
  type: MarketType
  status: MarketStatus
  yesPrice: number
  noPrice: number
  volume: number
  endsAt: string
  kalshiId?: string
}

export interface MarketDetail extends Market {
  yesMint: string
  noMint: string
  resolution?: 'YES' | 'NO'
  seedX: number
  seedY: number
  durationMs: number
}

export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps: number
}

export interface Quote {
  inputAmount: number
  outputAmount: number
  pricePerToken: number
  fee: number
}

export interface Position {
  marketId: string
  question: string
  tokenType: 'YES' | 'NO'
  amount: number
  entryPrice: number
  currentPrice: number
  status: 'ACTIVE' | 'RESOLVING' | 'CLAIMABLE'
}

// ─── Stub data ────────────────────────────────────────────────────────────────

const SPRINT_MS = 15 * 60 * 1000
const DAILY_MS = 24 * 60 * 60 * 1000
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000

const STUB_MARKETS: MarketDetail[] = [
  {
    id: 'elon-btc-15min-001',
    question: 'Will Elon Musk tweet about Bitcoin in the next 15 minutes?',
    type: 'TRUTH_SPRINT',
    status: 'ACTIVE',
    yesPrice: 0.62,
    noPrice: 0.38,
    volume: 8600,
    endsAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    yesMint: 'YesMint111111111111111111111111111111111111',
    noMint: 'NoMint1111111111111111111111111111111111111',
    seedX: 1200,
    seedY: 600,
    durationMs: SPRINT_MS,
  },
  {
    id: 'btc-100k-daily-001',
    question: 'Will Bitcoin close above $100K today?',
    type: 'DAILY',
    status: 'ACTIVE',
    yesPrice: 0.71,
    noPrice: 0.29,
    volume: 42000,
    endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    yesMint: 'YesMint222222222222222222222222222222222222',
    noMint: 'NoMint2222222222222222222222222222222222222',
    seedX: 3500,
    seedY: 1750,
    durationMs: DAILY_MS,
  },
  {
    id: 'eth-5k-weekly-001',
    question: 'Will ETH hit $5K this week?',
    type: 'WEEKLY',
    status: 'ACTIVE',
    yesPrice: 0.45,
    noPrice: 0.55,
    volume: 180000,
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    yesMint: 'YesMint333333333333333333333333333333333333',
    noMint: 'NoMint3333333333333333333333333333333333333',
    seedX: 12000,
    seedY: 6000,
    durationMs: WEEKLY_MS,
  },
]

// ─── DFlow → truth.fun type mapping ──────────────────────────────────────────

function deriveMarketType(openTime: number, closeTime: number): MarketType {
  const ms = (closeTime - openTime) * 1000
  if (ms < 2 * 60 * 60 * 1000) return 'TRUTH_SPRINT'
  if (ms < 25 * 60 * 60 * 1000) return 'DAILY'
  return 'WEEKLY'
}

function mapDFlowStatus(s: string): MarketStatus {
  if (s === 'closed') return 'RESOLVING'
  if (s === 'determined') return 'DETERMINED'
  return 'ACTIVE'
}

function mapMarket(m: DFlowMarket): MarketDetail {
  const account = m.accounts[USDC_MINT]
  const yesPrice = parseFloat(m.yesAsk ?? m.yesBid ?? '0.5') || 0.5
  const noPrice = parseFloat(m.noAsk ?? m.noBid ?? '0.5') || 0.5
  // Ensure a sensible minimum duration so the phase math doesn't divide by zero
  const durationMs = Math.max((m.closeTime - m.openTime) * 1000, SPRINT_MS)

  return {
    id: m.ticker,
    question: m.title,
    type: deriveMarketType(m.openTime, m.closeTime),
    status: mapDFlowStatus(m.status),
    yesPrice,
    noPrice,
    volume: parseFloat(m.volumeFp ?? '0') || m.volume || 0,
    endsAt: new Date(m.closeTime * 1000).toISOString(),
    kalshiId: m.eventTicker,
    yesMint: account?.yesMint ?? '',
    noMint: account?.noMint ?? '',
    resolution: m.result === 'yes' ? 'YES' : m.result === 'no' ? 'NO' : undefined,
    // seedX/seedY are truth.fun-specific — not in DFlow, shown for demo transparency
    seedX: 1200,
    seedY: 600,
    durationMs,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getMarkets(): Promise<MarketDetail[]> {
  if (IS_STUB) return STUB_MARKETS

  try {
    const { events } = await getEvents({
      status: 'active',
      withNestedMarkets: true,
      isInitialized: true,
      limit: 25,
    })

    const markets: MarketDetail[] = []
    for (const event of events) {
      if (!event.markets) continue
      for (const m of event.markets) {
        if (m.status === 'active') markets.push(mapMarket(m))
      }
    }

    return markets.length > 0 ? markets : STUB_MARKETS
  } catch {
    return STUB_MARKETS
  }
}

export async function getMarket(marketTicker: string): Promise<MarketDetail> {
  if (IS_STUB) {
    return STUB_MARKETS.find((m) => m.id === marketTicker) ?? STUB_MARKETS[0]
  }

  try {
    return mapMarket(await dflowGetMarket(marketTicker))
  } catch {
    return STUB_MARKETS.find((m) => m.id === marketTicker) ?? STUB_MARKETS[0]
  }
}

export async function getQuote(_params: QuoteParams): Promise<Quote> {
  // Full DFlow quote is handled via lib/dflow/tradeClient → useOrder() hook.
  // This stub is kept for legacy call sites.
  return {
    inputAmount: _params.amount,
    outputAmount: _params.amount / 0.62,
    pricePerToken: 0.62,
    fee: _params.amount * 0.01,
  }
}

export async function getPositions(_walletAddress: string): Promise<Position[]> {
  // DFlow doesn't expose a wallet-level positions endpoint in our API surface.
  // Will be sourced from on-chain SPL token balances in a future iteration.
  return []
}

export async function getMarketStatus(marketTicker: string): Promise<MarketStatus> {
  if (IS_STUB) return 'ACTIVE'
  const market = await getMarket(marketTicker)
  return market.status
}
