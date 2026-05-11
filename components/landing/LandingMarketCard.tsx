'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { WobblyCard } from '@/components/ui/WobblyCard'

interface LandingMarketCardProps {
  question: string
  yesPrice: number | null
  noPrice: number | null
  bonus: number
  timeLeft: string
  index?: number
  hot?: boolean
  marketTicker?: string
}

export function LandingMarketCard({ question, yesPrice, noPrice, bonus, timeLeft, index = 0, hot = false, marketTicker }: LandingMarketCardProps) {
  const [yesClicked, setYesClicked] = useState(false)
  const [noClicked, setNoClicked] = useState(false)
  const rotation = useMemo(() => `${(Math.random() - 0.5) * 4}deg`, [])

  return (
    <WobblyCard style={{ rotate: rotation as any }}>
      {hot && (
        <motion.div className="absolute -top-3 -right-3 bg-accent-red text-white font-mono text-xs font-bold px-3 py-1 rounded-full border-2 border-ink" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          HOT 🔥
        </motion.div>
      )}
      <h3 className="font-display font-bold text-lg md:text-xl mb-4 text-ink leading-snug">{question}</h3>
      <svg viewBox="0 0 200 60" className="w-full h-12 mb-4 opacity-70" preserveAspectRatio="none">
        <motion.path d="M10,50 Q50,20 100,15 Q150,12 190,25" fill="none" stroke="currentColor" strokeWidth="2" initial={{ strokeDasharray: 300, strokeDashoffset: 300 }} whileInView={{ strokeDashoffset: 0 }} transition={{ duration: 1.5, ease: 'easeInOut' }} viewport={{ once: true }} />
      </svg>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.button className={`sketch-border border-2 border-accent-green rounded-lg py-2 px-3 font-mono font-bold text-center cursor-pointer transition-all ${yesClicked ? 'bg-accent-green text-black' : 'bg-bg text-accent-green'}`} onClick={() => { setYesClicked(true); setTimeout(() => setYesClicked(false), 600) }} whileHover={{ scale: 1.05 }}>
          YES<br /><span className="text-sm font-normal">{yesPrice !== null ? `${(yesPrice * 100).toFixed(0)}¢` : '—'}</span>
        </motion.button>
        <motion.button className={`sketch-border border-2 border-accent-red rounded-lg py-2 px-3 font-mono font-bold text-center cursor-pointer transition-all ${noClicked ? 'bg-accent-red text-white' : 'bg-bg text-accent-red'}`} onClick={() => { setNoClicked(true); setTimeout(() => setNoClicked(false), 600) }} whileHover={{ scale: 1.05 }}>
          NO<br /><span className="text-sm font-normal">{noPrice !== null ? `${(noPrice * 100).toFixed(0)}¢` : '—'}</span>
        </motion.button>
      </div>
      <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-border text-xs text-ink-light font-ui">
        <span>Open Interest:</span>
        <span className="font-mono font-bold text-accent-purple">${bonus > 0 ? bonus.toLocaleString() : '—'}</span>
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-ink-muted font-mono">
        <span>{timeLeft}</span>
        {marketTicker && (
          <Link
            href={`/markets/${marketTicker}`}
            className="text-accent-blue hover:text-accent-purple transition-colors font-ui font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </Link>
        )}
      </div>
    </WobblyCard>
  )
}
