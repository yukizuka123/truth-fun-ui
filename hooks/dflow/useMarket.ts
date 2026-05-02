import { useQuery } from '@tanstack/react-query'
import { getMarket } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_MARKET } from '@/lib/dflow/mockData'

export function useMarket(ticker: string) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'market', ticker],
    queryFn: dummy ? () => MOCK_MARKET : () => getMarket(ticker),
    enabled: !!ticker,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  })
}
