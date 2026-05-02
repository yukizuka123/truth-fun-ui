import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

async function json(url: string) {
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error ?? `${r.status} ${r.statusText}`)
  }
  return r.json()
}

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => json('/api/dashboard'),
    staleTime: 60_000,
  })

export interface MarketsFilters {
  status?: string
  category?: string
  seriesTickers?: string
  sort?: string
}

export const useMarkets = (filters: MarketsFilters = {}) =>
  useInfiniteQuery({
    queryKey: ['markets', filters],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ cursor: String(pageParam ?? 0) })
      for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v)
      return json(`/api/markets?${qs.toString()}`)
    },
    initialPageParam: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getNextPageParam: (last: any) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  })

export const useMarket = (ticker: string) =>
  useQuery({
    queryKey: ['market', ticker],
    queryFn: () => json(`/api/markets/${ticker}`),
    enabled: !!ticker,
    staleTime: 10_000,
  })

export const useCandles = (ticker: string, periodInterval = '60') =>
  useQuery({
    queryKey: ['candles', ticker, periodInterval],
    queryFn: () => json(`/api/markets/${ticker}/candles?periodInterval=${periodInterval}`),
    enabled: !!ticker,
    staleTime: 60_000,
  })

export const useOrderbook = (ticker: string) =>
  useQuery({
    queryKey: ['orderbook', ticker],
    queryFn: () => json(`/api/markets/${ticker}/orderbook`),
    enabled: !!ticker,
    refetchInterval: 3_000,
    staleTime: 0,
  })

export const useTrades = (ticker: string) =>
  useQuery({
    queryKey: ['trades', ticker],
    queryFn: () => json(`/api/markets/${ticker}/trades`),
    enabled: !!ticker,
    refetchInterval: 5_000,
    staleTime: 0,
  })

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => json(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 5 * 60_000,
  })

export const useFilters = () =>
  useQuery({
    queryKey: ['filters'],
    queryFn: () => json('/api/filters'),
    staleTime: 60 * 60_000,
  })
