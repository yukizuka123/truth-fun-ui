'use client'

import { useState, useEffect } from 'react'
import { IS_STUB } from '@/lib/dflow'
import { dflowWs } from '@/lib/dflow/wsClient'
import type { Orderbook } from '@/lib/dflow/types'

// Returns the best YES bid from the DFlow live orderbook for a market ticker.
// In stub mode, simulates small random price movements instead.
export function useLivePrice(marketTicker: string): number | null {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    if (!marketTicker) return

    if (IS_STUB) {
      // Seed a plausible starting price for known stub markets
      const SEEDS: Record<string, number> = {
        'elon-btc-15min-001': 0.62,
        'btc-100k-daily-001': 0.71,
        'eth-5k-weekly-001': 0.45,
      }
      const base = SEEDS[marketTicker] ?? 0.5
      setPrice(base)
      const interval = setInterval(() => {
        setPrice((p) => {
          const current = p ?? base
          const delta = (Math.random() - 0.48) * 0.008
          return Math.max(0.01, Math.min(0.99, current + delta))
        })
      }, 5000)
      return () => clearInterval(interval)
    }

    // Real mode — use the shared DFlow WebSocket singleton
    dflowWs.connect()
    dflowWs.subscribe('orderbook', [marketTicker])

    const off = dflowWs.on((msg) => {
      if (msg.channel !== 'orderbook') return
      const ob = msg.data as Orderbook
      // yes_bids keys are decimal strings like "0.6500"; find the highest bid
      const bidKeys = Object.keys(ob.yes_bids)
      if (bidKeys.length === 0) return
      const bestBid = Math.max(...bidKeys.map(Number))
      if (bestBid > 0) setPrice(bestBid)
    })

    return () => {
      off()
      dflowWs.unsubscribe('orderbook', [marketTicker])
    }
  }, [marketTicker])

  return price
}
