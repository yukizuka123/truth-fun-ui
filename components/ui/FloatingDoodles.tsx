'use client'

import { motion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'

export function FloatingDoodles() {
  const [mounted, setMounted] = useState(false)

  const doodles = useMemo(() => {
    if (!mounted) return []
    const items = ['x·y=k', 'Σ', '∂f/∂t', 'π²', '⚡', '$1.00', 'P(x)', '∫', '★', '∇']
    return items.map((txt, i) => ({
      txt,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 18 + Math.random() * 24,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      floatDistance: 12 + Math.random() * 16,
      opacity: 0.12 + Math.random() * 0.13,
      id: `doodle-${i}`,
    }))
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {doodles.map((d) => (
        <motion.span
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.left}%`,
            top: `${d.top}%`,
            fontSize: d.size,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink)',
            opacity: d.opacity,
            userSelect: 'none',
            willChange: 'transform',
          }}
          animate={{ y: [0, -d.floatDistance, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {d.txt}
        </motion.span>
      ))}
    </div>
  )
}
