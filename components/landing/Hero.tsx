'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { SketchButton } from '@/components/ui/SketchButton'

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

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-mono font-bold text-4xl md:text-5xl text-ink">{value.toLocaleString()}</div>
      <div className="font-ui text-xs md:text-sm uppercase text-ink-light tracking-wider">{label}</div>
    </div>
  )
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const vol = useNumberScramble(2847650, 1200, visible)
  const markets = useNumberScramble(342, 900, visible)
  const bonus = useNumberScramble(48720, 1000, visible)

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center px-6 py-24 pt-32 bg-bg relative overflow-hidden">
      <svg viewBox="0 0 600 200" className="absolute inset-0 w-full h-full max-h-64 opacity-10 pointer-events-none" preserveAspectRatio="none">
        <motion.path d="M50,150 Q150,50 300,30 Q450,20 550,80" fill="none" stroke="currentColor" strokeWidth="3" initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }} animate={visible ? { strokeDashoffset: 0 } : {}} transition={{ duration: 2, ease: 'easeInOut' }} />
      </svg>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut' }} className="font-mono text-xs md:text-sm text-accent-blue uppercase tracking-widest font-bold mb-6">
        A new kind of prediction market
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }} className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-center mb-6 leading-tight tracking-tight">
        Prediction Markets<br />
        <span className="inline-block bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent">
          <motion.span animate={{ rotate: [-1, 1.5, -0.5, 1, -1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="inline-block origin-center">Got Unhinged</motion.span>
        </span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }} className="font-body text-xl md:text-2xl text-ink-light text-center mb-12 max-w-2xl">
        Trade prediction markets on 15-minute Truth Sprints with bonding curves, bonus yields, and degen speed
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }} className="flex flex-col md:flex-row gap-6 mb-16">
        <SketchButton primary>Start Trading</SketchButton>
        <SketchButton primary={false}>Create a Market</SketchButton>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 }} className="flex flex-col md:flex-row gap-12 md:gap-20">
        <StatBox label="Total Volume" value={vol} />
        <StatBox label="Active Markets" value={markets} />
        <StatBox label="Bonus Pool" value={bonus} />
      </motion.div>

      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-light font-body text-lg">
        ↓
      </motion.div>
    </section>
  )
}
