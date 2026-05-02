'use client'

import { useEffect, useState } from 'react'
import { dflowWs } from '@/lib/dflow/wsClient'
import { useDummyMode } from './useDummyMode'
import { MOCK_ORDERBOOK } from '@/lib/dflow/mockData'
import type { Orderbook } from '@/lib/dflow/types'

export function useOrderbookStream(marketTicker: string) {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null)
  const dummy = useDummyMode()

  useEffect(() => {
    if (dummy) {
      setOrderbook(MOCK_ORDERBOOK)
      return
    }

    if (!marketTicker) return
    dflowWs.connect()
    dflowWs.subscribe('orderbook', [marketTicker])
    const cleanup = dflowWs.on((msg) => {
      if (msg.channel === 'orderbook') setOrderbook(msg.data as Orderbook)
    })
    return () => {
      cleanup()
      dflowWs.unsubscribe('orderbook', [marketTicker])
    }
  }, [marketTicker, dummy])

  return orderbook
}
