import type { DFlowEvent as BaseDFlowEvent, Market } from './dflow/types'

export type DFlowMarket = Market

// Extends the base type with fields present in real responses but not yet in types.ts
export interface DFlowEvent extends BaseDFlowEvent {
  createdAt?: number | null
  category?: string | null
}

/**
 * Binary events have exactly one YES/NO market. Multi-outcome events (e.g. "Who wins
 * the election?") have multiple markets — one per candidate. DFlow has no binary=true
 * filter; we identify by structure. Always fetch with withNestedMarkets=true first.
 */
export const isBinaryEvent = (e: DFlowEvent): boolean =>
  Array.isArray(e.markets) && e.markets.length === 1

export const binaryMarket = (e: DFlowEvent): DFlowMarket | null =>
  e.markets?.[0] ?? null
