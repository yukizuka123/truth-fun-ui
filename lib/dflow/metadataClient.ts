import { DFLOW } from './config'
import type {
  TagsByCategories,
  Series,
  DFlowEvent,
  Market,
  Orderbook,
  Trade,
  PaginatedEvents,
} from './types'
import { DFlowApiError } from './errors'

async function dflowFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options })
  if (!res.ok) {
    const text = await res.text()
    throw new DFlowApiError(res.status, url, `DFlow API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, DFLOW.metadata)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

// Tags
export async function getTagsByCategories(): Promise<TagsByCategories> {
  const data = await dflowFetch<{ tagsByCategories: TagsByCategories }>(
    buildUrl('/api/v1/tags_by_categories')
  )
  return data.tagsByCategories
}

// Series
export async function getSeries(params?: {
  category?: string
  tags?: string
  isInitialized?: boolean
  status?: string
}): Promise<Series[]> {
  const data = await dflowFetch<{ series: Series[] }>(buildUrl('/api/v1/series', params))
  return data.series
}

export async function getSeriesByTicker(ticker: string): Promise<Series> {
  return dflowFetch<Series>(buildUrl(`/api/v1/series/${encodeURIComponent(ticker)}`))
}

// Events
export async function getEvents(params?: {
  seriesTickers?: string
  status?: string
  withNestedMarkets?: boolean
  isInitialized?: boolean
  limit?: number
  cursor?: number
  sort?: 'volume' | 'volume24h' | 'liquidity' | 'openInterest' | 'startDate'
}): Promise<PaginatedEvents> {
  return dflowFetch<PaginatedEvents>(buildUrl('/api/v1/events', params))
}

export async function getEvent(
  ticker: string,
  params?: { withNestedMarkets?: boolean }
): Promise<DFlowEvent> {
  return dflowFetch<DFlowEvent>(
    buildUrl(`/api/v1/event/${encodeURIComponent(ticker)}`, params)
  )
}

// Markets
export async function getMarket(ticker: string): Promise<Market> {
  return dflowFetch<Market>(buildUrl(`/api/v1/market/${encodeURIComponent(ticker)}`))
}

export async function getMarketByMint(mintAddress: string): Promise<Market> {
  return dflowFetch<Market>(
    buildUrl(`/api/v1/market/by-mint/${encodeURIComponent(mintAddress)}`)
  )
}

export async function getMarkets(params?: {
  seriesTickers?: string
  status?: string
  isInitialized?: boolean
  limit?: number
  cursor?: number
}): Promise<{ markets: Market[]; cursor: number | null }> {
  return dflowFetch<{ markets: Market[]; cursor: number | null }>(
    buildUrl('/api/v1/markets', params)
  )
}

export async function getMarketsBatch(tickers: string[]): Promise<Market[]> {
  const data = await dflowFetch<{ markets: Market[] }>(
    buildUrl('/api/v1/markets/batch'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers }),
    }
  )
  return data.markets
}

// Orderbook
export async function getOrderbook(marketTicker: string): Promise<Orderbook> {
  return dflowFetch<Orderbook>(
    buildUrl(`/api/v1/orderbook/${encodeURIComponent(marketTicker)}`)
  )
}

export async function getOrderbookByMint(mintAddress: string): Promise<Orderbook> {
  return dflowFetch<Orderbook>(
    buildUrl(`/api/v1/orderbook/by-mint/${encodeURIComponent(mintAddress)}`)
  )
}

// Trades
export async function getMarketTrades(marketTicker: string): Promise<Trade[]> {
  const data = await dflowFetch<{ trades: Trade[] }>(
    buildUrl(`/api/v1/trades/${encodeURIComponent(marketTicker)}`)
  )
  return data.trades
}

// Search
export async function searchEvents(params: {
  query: string
  withNestedMarkets?: boolean
}): Promise<{ events: DFlowEvent[] }> {
  return dflowFetch<{ events: DFlowEvent[] }>(buildUrl('/api/v1/search', params))
}
