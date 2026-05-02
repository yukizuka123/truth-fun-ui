import { useInfiniteQuery } from '@tanstack/react-query'
import { useDummyMode } from './useDummyMode'
import { MOCK_EVENTS } from '@/lib/dflow/mockData'
import type { PaginatedEvents } from '@/lib/dflow/types'

export type MarketSort = 'volume24h' | 'volume' | 'liquidity' | 'openInterest' | 'startDate'
export type MarketStatus = 'active' | 'closed' | 'all'

export interface MarketplaceFilters {
  sort?: MarketSort
  status?: MarketStatus
  seriesTickers?: string
  limit?: number
}

async function fetchPage(
  filters: MarketplaceFilters,
  cursor: number | undefined
): Promise<PaginatedEvents> {
  const p = new URLSearchParams()
  p.set('sort', filters.sort ?? 'volume24h')
  p.set('status', filters.status ?? 'active')
  p.set('limit', String(filters.limit ?? 50))
  if (cursor !== undefined) p.set('cursor', String(cursor))
  if (filters.seriesTickers) p.set('seriesTickers', filters.seriesTickers)

  const res = await fetch(`/api/proxy/events?${p.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<PaginatedEvents>
}

export function useMarketplace(filters: MarketplaceFilters = {}) {
  const dummy = useDummyMode()

  return useInfiniteQuery({
    queryKey: ['dflow', 'marketplace', filters] as const,
    queryFn: dummy
      ? () => Promise.resolve({ events: MOCK_EVENTS.events, cursor: null } as PaginatedEvents)
      : ({ pageParam }: { pageParam: number | undefined }) => fetchPage(filters, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: PaginatedEvents) => lastPage.cursor ?? undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
