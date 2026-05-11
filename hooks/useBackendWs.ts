'use client'

import { useEffect } from 'react'
import { mutate } from 'swr'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

function wsUrl(): string {
  return BACKEND_URL.replace(/^http(s?):\/\//, (_, s) => `ws${s}://`) + '/ws'
}

interface Envelope {
  type?: string
  data?: unknown
  ts?: number
}

const CHART_KEY_PREFIXES = ['curve-', 'bonus-']

function revalidateChartKeys(): void {
  void mutate(
    (key) =>
      typeof key === 'string' &&
      CHART_KEY_PREFIXES.some((p) => key.startsWith(p)),
    undefined,
    { revalidate: true },
  )
}

/**
 * Subscribes to the backend `/ws` envelope stream and revalidates SWR cache
 * keys for chart hooks (`curve-*`, `bonus-*`) whenever an on-chain state
 * change is announced. This makes `PriceChart` / `BonusPoolChart` redraw
 * the instant an arb runs instead of waiting up to 3s for the next poll —
 * critical on devnet where the public RPC throttle can stretch a single
 * `program.account.market.fetch()` past the polling cadence.
 *
 * Trigger events:
 *   - `arb_executed`   — Direction A/B landed; curve state changed
 *   - `curve_update`   — observer detected curveBps change (1Hz tick)
 *   - `spread_update`  — emitted on every observer tick where curve OR
 *                        oracle moved
 *   - `oracle_update`  — oracle price changed (T+60 demo shock)
 *
 * Revalidates are de-duped to once per 500ms because `spread_update` can
 * fire at 1Hz which would thrash the fetch path.
 */
export function useBackendWs(): void {
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectT: ReturnType<typeof setTimeout> | null = null
    let lastRevalidateMs = 0
    let disposed = false

    const scheduleRevalidate = (): void => {
      const now = Date.now()
      if (now - lastRevalidateMs < 500) return
      lastRevalidateMs = now
      revalidateChartKeys()
    }

    const connect = (): void => {
      if (disposed) return
      try {
        ws = new WebSocket(wsUrl())
      } catch {
        reconnectT = setTimeout(connect, 5000)
        return
      }
      ws.onmessage = (evt) => {
        let env: Envelope | null = null
        try {
          env = JSON.parse(typeof evt.data === 'string' ? evt.data : '') as Envelope
        } catch {
          return
        }
        switch (env.type) {
          case 'arb_executed':
          case 'curve_update':
          case 'spread_update':
          case 'oracle_update':
            scheduleRevalidate()
            break
          default:
            break
        }
      }
      ws.onclose = () => {
        ws = null
        if (!disposed) reconnectT = setTimeout(connect, 3000)
      }
      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          // ignore — onclose handles reconnect scheduling
        }
      }
    }

    connect()
    return () => {
      disposed = true
      if (reconnectT) clearTimeout(reconnectT)
      if (ws) {
        try {
          ws.close()
        } catch {
          // ignore
        }
      }
    }
  }, [])
}
