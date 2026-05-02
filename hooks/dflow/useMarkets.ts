import { useQuery } from '@tanstack/react-query'
import { getMarkets } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_MARKET } from '@/lib/dflow/mockData'

type MarketsParams = Parameters<typeof getMarkets>[0]

export function useMarkets(params?: MarketsParams) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'markets', params],
    queryFn: dummy ? () => ({ markets: [MOCK_MARKET], cursor: null }) : () => getMarkets(params),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
