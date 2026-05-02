import { useQuery } from '@tanstack/react-query'
import { getOrderStatus } from '@/lib/dflow/tradeClient'

export function useOrderStatus(signature: string | null, lastValidBlockHeight?: number) {
  return useQuery({
    queryKey: ['dflow', 'order-status', signature],
    queryFn: () => getOrderStatus({ signature: signature!, lastValidBlockHeight }),
    enabled: !!signature,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status) return 2000
      return ['closed', 'expired', 'failed'].includes(status) ? false : 2000
    },
    staleTime: 0,
  })
}
