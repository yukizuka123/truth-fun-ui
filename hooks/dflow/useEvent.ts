import { useQuery } from '@tanstack/react-query'
import { useDummyMode } from './useDummyMode'
import { MOCK_EVENT } from '@/lib/dflow/mockData'
import type { DFlowEvent } from '@/lib/dflow/types'

export function useEvent(ticker: string, _params?: { withNestedMarkets?: boolean }) {
  const dummy = useDummyMode()
  return useQuery<DFlowEvent>({
    queryKey: ['dflow', 'event', ticker],
    queryFn: async (): Promise<DFlowEvent> => {
      if (dummy) return MOCK_EVENT
      const res = await fetch(`/api/events/${encodeURIComponent(ticker)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<DFlowEvent>
    },
    enabled: !!ticker,
    staleTime: 15_000,
    refetchInterval: 15_000,
  })
}
