import type { DFlowEnv } from './config'
export type { DFlowEnv }

export interface DFlowConfig {
  env: DFlowEnv
  metadata: string
  metadataWs: string
  trade: string
  tradeWs: string
}

export interface Series {
  ticker: string
  title: string
  category: string
  tags: string[]
  frequency: string
  feeType: string
  feeMultiplier: number
  settlementSources: { name: string; url: string }[]
  contractUrl: string
  contractTermsUrl: string
}

export interface MarketAccountInfo {
  marketLedger: string
  yesMint: string
  noMint: string
  isInitialized: boolean
  redemptionStatus: string | null
  scalarOutcomePct: number | null
}

export interface Market {
  ticker: string
  eventTicker: string
  marketType: string
  title: string
  subtitle: string
  yesSubTitle: string
  noSubTitle: string
  openTime: number
  closeTime: number
  expirationTime: number
  status: 'active' | 'inactive' | 'closed' | 'determined' | 'initialized'
  result: string
  volume: number
  openInterest: number
  canCloseEarly: boolean
  earlyCloseCondition: string | null
  rulesPrimary: string
  rulesSecondary: string | null
  yesBid: string | null
  yesAsk: string | null
  noBid: string | null
  noAsk: string | null
  volumeFp: string | null
  volume24hFp: string | null
  openInterestFp: string | null
  fractionalTradingEnabled: boolean
  accounts: Record<string, MarketAccountInfo>
}

export interface DFlowEvent {
  ticker: string
  seriesTicker: string
  title: string
  subtitle: string | null
  competition: string | null
  competitionScope: string | null
  imageUrl: string | null
  liquidity: number | null
  openInterest: number | null
  openInterestFp: string | null
  volume: number | null
  volumeFp: string | null
  volume24h: number | null
  volume24hFp: string | null
  strikeDate: number | null
  strikePeriod: string | null
  settlementSources: { name: string; url: string }[] | null
  markets: Market[] | null
}

export interface Trade {
  tradeId: string
  ticker: string
  price: number
  count: number
  yesPrice: number
  noPrice: number
  yesPriceDollars: string
  noPriceDollars: string
  takerSide: string
  createdTime: number
}

export interface Orderbook {
  sequence: number
  yes_bids: Record<string, number>
  no_bids: Record<string, number>
}

export interface RoutePlanLeg {
  venue: string
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  inputMintDecimals: number
  outputMintDecimals: number
  marketKey: string
  data: string
}

export interface OrderResponse {
  contextSlot: number
  executionMode: 'sync' | 'async'
  inAmount: string
  inputMint: string
  outAmount: string
  outputMint: string
  minOutAmount: string
  otherAmountThreshold: string
  priceImpactPct: string
  slippageBps: number
  lastValidBlockHeight: number | null
  transaction: string | null
  revertMint: string | null
  initPredictionMarketCost: number | null
  predictionMarketInitPayerMustSign: boolean | null
  predictionMarketSlippageBps: number | null
  prioritizationFeeLamports: number | null
  computeUnitLimit: number | null
  platformFee: { amount: string; feeBps: number; mode: string } | null
  routePlan: RoutePlanLeg[] | null
}

export interface OrderFill {
  signature: string
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
}

export interface OrderRevert {
  signature: string
  mint: string
  amount: string
}

export interface OrderStatusResponse {
  status: 'pending' | 'open' | 'pendingClose' | 'closed' | 'expired' | 'failed'
  inAmount: string
  outAmount: string
  fills: OrderFill[]
  reverts: OrderRevert[]
}

export type TagsByCategories = Record<string, string[] | null>

export interface PaginatedEvents {
  events: DFlowEvent[]
  cursor: number | null
}
