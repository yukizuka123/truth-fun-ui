import useSWR from 'swr'
import { getBondingCurveState } from '@/lib/anchor'
import { CurveState, spotPrice } from '@/lib/math'

export function useCurveState(marketId: string) {
  const { data, error, isLoading, mutate } = useSWR<CurveState>(
    `curve-${marketId}`,
    () => getBondingCurveState(marketId),
    { refreshInterval: 10000 }
  )

  return {
    curveState: data,
    curvePrice: data ? spotPrice(data) : null,
    isLoading,
    error,
    refresh: mutate,
  }
}
