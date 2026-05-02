'use client'

import { DFLOW } from './config'
import type { Orderbook, Trade } from './types'

type WsChannel = 'orderbook' | 'trades'

interface WsMessage {
  channel: WsChannel
  data: Orderbook | Trade
}

type WsCallback = (msg: WsMessage) => void

export class DFlowWsClient {
  private ws: WebSocket | null = null
  private callbacks: Set<WsCallback> = new Set()
  private subscriptions: Map<WsChannel, Set<string>> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.ws = new WebSocket(DFLOW.metadataWs)

    this.ws.onopen = () => {
      // Re-subscribe to all active subscriptions after reconnect
      for (const [channel, tickers] of this.subscriptions.entries()) {
        if (tickers.size > 0) {
          this.send({ action: 'subscribe', channel, market_tickers: Array.from(tickers) })
        }
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage
        for (const cb of this.callbacks) cb(msg)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  subscribe(channel: WsChannel, marketTickers: string[]): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }
    const set = this.subscriptions.get(channel)!
    for (const t of marketTickers) set.add(t)
    this.send({ action: 'subscribe', channel, market_tickers: marketTickers })
  }

  unsubscribe(channel: WsChannel, marketTickers: string[]): void {
    const set = this.subscriptions.get(channel)
    if (set) {
      for (const t of marketTickers) set.delete(t)
    }
    this.send({ action: 'unsubscribe', channel, market_tickers: marketTickers })
  }

  on(callback: WsCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => this.connect(), 3000)
  }
}

// Singleton shared across all hooks
export const dflowWs = new DFlowWsClient()
