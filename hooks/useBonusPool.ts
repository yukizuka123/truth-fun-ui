import useSWR from 'swr'
import { getBonusPoolState, BonusPoolState } from '@/lib/anchor'
import { bonusPerToken, effectiveReturn } from '@/lib/math'

export function useBonusPool(marketId: string, entryPrice = 0.6) {
  const { data, isLoading, mutate } = useSWR<BonusPoolState>(
    `bonus-${marketId}`,
    () => getBonusPoolState(marketId),
    { refreshInterval: 10000 }
  )

  const bpt = data ? bonusPerToken(data.balance, data.winningTokensOutstanding) : 0
  const effReturn = effectiveReturn(bpt, entryPrice)

  return {
    balance: data?.balance ?? 0,
    totalVolume: data?.totalVolume ?? 0,
    winningTokens: data?.winningTokensOutstanding ?? 10000,
    bonusPerToken: bpt,
    effectiveReturn: effReturn,
    isLoading,
    refresh: mutate,
  }
}
