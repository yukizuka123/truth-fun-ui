'use client'

import { motion } from 'framer-motion'

const GAMES = [
  { title: 'Early Buyer Game', color: '#4db3ff', description: 'Get in when the pool is thin, ride the bonding curve, sell into FOMO before resolution.', example: '$200 → 2.2x return in 15 minutes', icon: '⚡' },
  { title: 'Arbitrage Game', color: '#ffd54f', description: 'Close the spread between truth.fun curve price and DFlow base price. Protocol captures 20% into Bonus Pool.', example: '±2% spread = 20-40% APY trades', icon: '🔄' },
  { title: 'Yield Game', color: '#b47dff', description: 'Hold winning tokens to resolution → $1.00 Kalshi floor + Bonus Pool share amplified by all preceding volume.', example: '$1.00 + $0.14 bonus yield per token', icon: '🏆' },
]

export function ThreeGames() {
  return (
    <section className="py-24 px-6 bg-bg max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }} className="text-center mb-16">
        <h2 className="font-display font-black text-4xl md:text-5xl text-ink mb-4">Three Simultaneous Games</h2>
        <p className="font-body text-lg md:text-xl text-ink-light">Find your edge. Pick your game. Trade like a degen.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {GAMES.map((game, idx) => (
          <motion.div key={game.title} initial={{ opacity: 0, y: 30, rotate: (idx - 1) * 1.2 }} whileInView={{ opacity: 1, y: 0, rotate: (idx - 1) * 1.2 }} whileHover={{ y: -8, rotate: 0, boxShadow: `5px 5px 0 ${game.color}` }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.15 }} className="sketch-border border-4 border-ink rounded-lg p-8 bg-bg-card cursor-pointer" style={{ borderLeftWidth: '8px', borderLeftColor: game.color, boxShadow: '3px 3px 0 var(--ink)' }}>
            <div className="text-5xl mb-4">{game.icon}</div>
            <h3 className="font-display font-bold text-2xl text-ink mb-3">{game.title}</h3>
            <p className="font-body text-base text-ink-light mb-4 leading-relaxed">{game.description}</p>
            <div className="inline-block font-mono font-bold text-white px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: game.color }}>{game.example}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
