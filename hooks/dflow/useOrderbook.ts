import { useQuery } from '@tanstack/react-query'
import { getOrderbook } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_ORDERBOOK } from '@/lib/dflow/mockData'

export function useOrderbook(marketTicker: string) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'orderbook', marketTicker],
    queryFn: dummy ? () => MOCK_ORDERBOOK : () => getOrderbook(marketTicker),
    enabled: !!marketTicker,
    staleTime: 2 * 1000,
    refetchInterval: 2 * 1000,
  })
}
