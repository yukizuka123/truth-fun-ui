import { useQuery } from '@tanstack/react-query'
import { getMarketByMint } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_MARKET } from '@/lib/dflow/mockData'

export function useMarketByMint(mintAddress: string) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'market', 'by-mint', mintAddress],
    queryFn: dummy ? () => MOCK_MARKET : () => getMarketByMint(mintAddress),
    enabled: !!mintAddress,
    staleTime: 10 * 1000,
  })
}
