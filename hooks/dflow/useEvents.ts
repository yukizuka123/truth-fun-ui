import { useQuery } from '@tanstack/react-query'
import { getEvents } from '@/lib/dflow/metadataClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_EVENTS } from '@/lib/dflow/mockData'

type EventsParams = Parameters<typeof getEvents>[0]

export function useEvents(params?: EventsParams) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'events', params],
    queryFn: dummy ? () => MOCK_EVENTS : () => getEvents(params),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
