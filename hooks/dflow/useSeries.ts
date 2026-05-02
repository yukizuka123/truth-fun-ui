import { useQuery } from '@tanstack/react-query'
import { getSeries } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_SERIES } from '@/lib/dflow/mockData'

type SeriesParams = Parameters<typeof getSeries>[0]

export function useSeries(params?: SeriesParams) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'series', params],
    queryFn: dummy ? () => MOCK_SERIES : () => getSeries(params),
    staleTime: 5 * 60 * 1000,
  })
}
