'use client'

import { motion } from 'framer-motion'

interface MarketItem {
  id: string
  question: string
  yesPrice: number
  noPrice: number
  vol?: number
  hot?: boolean
}

interface MarqueeTickerProps {
  items: MarketItem[]
}

export function MarqueeTicker({ items }: MarqueeTickerProps) {
  const doubled = [...items, ...items]

  return (
    <div className="sketch-border border-t-4 border-b-4 border-dashed border-ink py-3.5 px-6 bg-bg-secondary overflow-hidden">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -50] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((market, idx) => (
          <div key={`${market.id}-${idx}`} className="sketch-border border-2 border-ink rounded-full px-4 py-1.5 bg-bg flex-shrink-0 flex items-center gap-2">
            <span className="font-ui text-sm font-medium whitespace-nowrap">{market.question}</span>
            <span className="font-mono text-xs font-bold text-accent-green">${market.yesPrice.toFixed(2)}</span>
            <span className="font-mono text-xs font-bold text-accent-red">${market.noPrice.toFixed(2)}</span>
            {market.vol && <span className="font-ui text-xs text-ink-light">Vol: ${(market.vol / 1000).toFixed(1)}k</span>}
            {market.hot && <span className="text-xs font-mono font-bold text-accent-red animate-pulse">🔥</span>}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
