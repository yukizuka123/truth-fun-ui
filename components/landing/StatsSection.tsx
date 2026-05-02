'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function useNumberScramble(target: number, duration = 800, active = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.floor(p * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active])
  return val
}

const STATS = [
  { label: 'Total Volume', value: 127500000, suffix: '' },
  { label: 'Markets Created', value: 14200, suffix: '' },
  { label: 'Avg Bonus Multiple', value: 147, suffix: 'x', isDecimal: true },
]

const PARTNERS = ['SOLANA', 'DFLOW', 'KALSHI']

export function StatsSection() {
  const [visible, setVisible] = useState(false)

  return (
    <section className="py-24 px-6 bg-bg max-w-7xl mx-auto" onMouseEnter={() => setVisible(true)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        {STATS.map((stat, idx) => {
          const animated = useNumberScramble(stat.value, 1200, visible)
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.1 }} className="text-center">
              <div className="font-mono font-black text-5xl md:text-6xl text-ink mb-2">{stat.isDecimal ? (animated / 100).toFixed(2) : animated.toLocaleString()}{stat.suffix}</div>
              <div className="font-ui text-sm md:text-base uppercase text-ink-light tracking-wider">{stat.label}</div>
            </motion.div>
          )
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }} className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        <div className="font-ui text-sm text-ink-light uppercase tracking-wider">Powered by</div>
        {PARTNERS.map((partner) => (
          <div key={partner} className="sketch-border border-2 border-dashed border-ink-light rounded-full px-6 py-2 font-mono font-bold text-ink">
            {partner}
          </div>
        ))}
      </motion.div>
    </section>
  )
}
