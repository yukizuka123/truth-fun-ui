'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type MathSymbol = {
  char: string
  top?: string
  bottom?: string
  left?: string
  right?: string
  size: number
  rotate?: number
}

const MATH_SYMBOLS: MathSymbol[] = [
  { char: '∇', top: '20%', left: '7%', size: 30, rotate: -8 },
  { char: '±', top: '4%', left: '46%', size: 22 },
  { char: '∫', top: '7%', left: '53%', size: 34 },
  { char: '✶', top: '14%', left: '84%', size: 22, rotate: 12 },
  { char: '≥', top: '54%', left: '6%', size: 28, rotate: -4 },
  { char: 'λ', top: '40%', right: '8%', size: 34, rotate: 6 },
  { char: 'P(x)', top: '38%', right: '14%', size: 18 },
  { char: '$1.00', top: '46%', right: '3%', size: 16, rotate: 6 },
  { char: '◇', top: '70%', right: '4%', size: 22 },
  { char: '↗', bottom: '14%', right: '8%', size: 22 },
  { char: '→', bottom: '14%', right: '3%', size: 22 },
  { char: '↘', bottom: '24%', left: '6%', size: 20 },
]

const ACCENT_YELLOW = '#F5C842'
const ACCENT_ORANGE = '#F5A623'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center px-6 py-24 pt-32 bg-bg relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] text-ink pointer-events-none" aria-hidden>
        <defs>
          <pattern id="heroBgGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heroBgGrid)" />
      </svg>

      {MATH_SYMBOLS.map((sym, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 0.18 } : {}}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.05 }}
          className="absolute font-mono text-ink pointer-events-none select-none"
          style={{
            top: sym.top,
            bottom: sym.bottom,
            left: sym.left,
            right: sym.right,
            fontSize: sym.size,
            transform: `rotate(${sym.rotate ?? 0}deg)`,
          }}
          aria-hidden
        >
          {sym.char}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative sketch-border border-2 border-dashed border-ink/40 rounded-full px-5 py-2 font-mono text-[11px] md:text-xs font-bold text-ink uppercase tracking-widest mb-10 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        Kalshi-settled · Solana-native · Bonding curves
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
        className="relative font-display font-black text-5xl md:text-7xl lg:text-8xl text-center mb-8 leading-[0.95] tracking-tight"
      >
        <span className="text-ink">The </span>
        <span className="relative inline-block align-baseline">
          <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent">
            pump.fun
          </span>
          <svg
            className="absolute pointer-events-none overflow-visible"
            style={{ top: '-6%', left: '-5%', width: '110%', height: '112%' }}
            viewBox="0 0 220 90"
            preserveAspectRatio="none"
            aria-hidden
          >
            <motion.path
              d="M 14,50 C 10,20 75,8 118,8 C 168,8 214,18 210,46 C 206,74 152,82 100,82 C 55,82 12,72 18,42 C 20,28 28,24 36,22"
              fill="none"
              stroke={ACCENT_ORANGE}
              strokeWidth="4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={visible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ pathLength: { duration: 1.6, delay: 0.9, ease: 'easeInOut' }, opacity: { duration: 0.2, delay: 0.9 } }}
            />
          </svg>
        </span>
        <br />
        <span className="text-ink">for </span>
        <span style={{ color: ACCENT_YELLOW }}>prediction</span>
        <br />
        <span style={{ color: ACCENT_YELLOW }}>markets</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
        className="font-body italic text-xl md:text-2xl text-ink-light text-center mb-12 max-w-2xl"
      >
        Regulated settlement. Degen speed. Bounded leverage.
      </motion.p>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-body italic text-ink-light text-base md:text-lg whitespace-nowrap"
      >
        ↓ scroll to explore ↓
      </motion.div>
    </section>
  )
}
