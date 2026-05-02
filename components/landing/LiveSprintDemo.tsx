'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { SketchButton } from '@/components/ui/SketchButton'

interface Trade {
  id: number
  side: 'YES' | 'NO'
  amount: number
  price: number
  timestamp: number
}

export function LiveSprintDemo() {
  const [price, setPrice] = useState(0.6)
  const [bonusPool, setBonusPool] = useState(847.32)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    let tradeNum = 0
    const interval = setInterval(() => {
      if (tradeNum >= 15) {
        clearInterval(interval)
        return
      }
      const side = Math.random() > 0.5 ? 'YES' : 'NO'
      const amount = 100 + Math.random() * 900
      const impact = side === 'YES' ? amount * 0.0015 : amount * -0.001
      setPrice((p) => Math.max(0.01, Math.min(0.99, p + impact)))
      setBonusPool((b) => b + amount * 0.01)
      setTrades((t) => [{ id: tradeNum, side, amount, price: Math.random() * 0.5 + 0.25, timestamp: Date.now() }, ...t])
      tradeNum++
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const handleManualBuy = (side: 'YES' | 'NO') => {
    const amount = 250
    const impact = side === 'YES' ? amount * 0.0015 : amount * -0.001
    setPrice((p) => Math.max(0.01, Math.min(0.99, p + impact)))
    setBonusPool((b) => b + amount * 0.01)
    setTrades((t) => [{ id: Date.now(), side, amount, price: Math.random() * 0.5 + 0.25, timestamp: Date.now() }, ...t])
  }

  const priceColor = price > 0.6 ? '#72bf4e' : '#ff6b6b'

  return (
    <section className="py-24 px-6 bg-bg-secondary max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }} className="text-center mb-12">
        <h2 className="font-display font-black text-4xl md:text-5xl text-ink mb-4">Live Truth Sprint Demo</h2>
        <p className="font-body text-lg md:text-xl text-ink-light">Watch a 15-minute prediction market come alive</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }} className="sketch-border border-4 border-ink rounded-lg p-8 bg-bg-card">
          <div className="font-ui text-sm uppercase text-ink-light mb-4 tracking-wider">Will Bitcoin exceed $100K?</div>
          <motion.div className="font-mono text-7xl font-bold mb-6" style={{ color: priceColor }} animate={{ color: priceColor }}>${price.toFixed(2)}</motion.div>
          <motion.div className="h-1 bg-border rounded-full overflow-hidden mb-8">
            <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, #ff6b6b, #ffd54f, #72bf4e)' }} animate={{ width: `${price * 100}%` }} transition={{ duration: 0.3 }} />
          </motion.div>
          <div className="flex gap-4 mb-8">
            <SketchButton primary onClick={() => handleManualBuy('YES')} className="flex-1">Buy YES</SketchButton>
            <SketchButton primary={false} onClick={() => handleManualBuy('NO')} className="flex-1">Buy NO</SketchButton>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-ui text-xs text-ink-muted uppercase tracking-wider">Bonus Pool</div>
              <div className="font-mono font-bold text-lg text-accent-yellow">${bonusPool.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-ui text-xs text-ink-muted uppercase tracking-wider">Trades</div>
              <div className="font-mono font-bold text-lg text-ink">{trades.length}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} className="sketch-border border-4 border-dashed border-ink rounded-lg p-6 bg-bg-card max-h-80 overflow-y-auto">
          <div className="font-ui text-xs uppercase text-ink-muted mb-4 tracking-wider">Recent Trades</div>
          <div className="space-y-2">
            {trades.length === 0 ? (
              <div className="text-center py-12 text-ink-light font-body text-lg">Waiting...</div>
            ) : (
              trades.map((trade) => (
                <motion.div key={trade.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex justify-between items-center px-4 py-2 rounded border-2 text-xs font-mono ${trade.side === 'YES' ? 'border-accent-green/30 bg-accent-green/5 text-accent-green' : 'border-accent-red/30 bg-accent-red/5 text-accent-red'}`}>
                  <span className="font-bold">{trade.side}</span>
                  <span>${trade.amount.toFixed(0)}</span>
                  <span className="text-ink-muted">${trade.price.toFixed(2)}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
