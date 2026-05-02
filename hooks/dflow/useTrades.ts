import { useQuery } from '@tanstack/react-query'
import { useDummyMode } from './useDummyMode'
import { generateMockTrades } from '@/lib/dflow/mockData'

// Map the real /onchain-trades/by-market response to the shape TradesChart expects.
// Real fields: id, createdAt (Unix sec), side ("yes"|"no"), usdPricePerContract (0-1),
//              contracts, transactionSignature, wallet
// Expected:    createdTime (ms for new Date()), yesPrice (0-1), noPrice (0-1)
function normalizeTrade(t: Record<string, unknown>) {
  const price = typeof t.usdPricePerContract === 'number' ? t.usdPricePerContract : 0
  const side = String(t.side ?? '').toLowerCase()
  const yesPrice = side === 'yes' ? price : 1 - price
  const noPrice = 1 - yesPrice

  const rawTs = typeof t.createdAt === 'number' ? t.createdAt : 0
  // Unix seconds → milliseconds for new Date()
  const createdTime = rawTs < 1e12 ? rawTs * 1000 : rawTs

  return {
    ...t,
    tradeId: t.id,
    createdTime,
    takerSide: side === 'yes' ? 'YES' : 'NO',
    yesPrice,
    noPrice,
    yesPriceDollars: yesPrice.toFixed(2),
    noPriceDollars: noPrice.toFixed(2),
    count: t.contracts,
  }
}

export function useTrades(marketTicker: string) {
  const dummy = useDummyMode()
  return useQuery({
    queryKey: ['dflow', 'trades', marketTicker],
    queryFn: async () => {
      if (dummy) return generateMockTrades(10)
      const res = await fetch(`/api/markets/${encodeURIComponent(marketTicker)}/trades`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      return (data.trades ?? []).map(normalizeTrade)
    },
    enabled: !!marketTicker,
    staleTime: 5_000,
    refetchInterval: 5_000,
  })
}
