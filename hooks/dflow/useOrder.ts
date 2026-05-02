import { useMutation } from '@tanstack/react-query'
import { getOrder, type GetOrderParams } from '@/lib/dflow/tradeClient'

export function useOrder() {
  return useMutation({
    mutationFn: (params: GetOrderParams) => getOrder(params),
  })
}
