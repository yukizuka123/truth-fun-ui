import { useQuery } from '@tanstack/react-query'
import { searchEvents } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_EVENTS } from '@/lib/dflow/mockData'

export function useSearch(query: string) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'search', query],
    queryFn: dummy ? () => MOCK_EVENTS : () => searchEvents({ query, withNestedMarkets: true }),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}
