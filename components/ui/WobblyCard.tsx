'use client'

import { motion } from 'framer-motion'
import React, { useState, useEffect } from 'react'

interface WobblyCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function WobblyCard({ children, className = '', style = {} }: WobblyCardProps) {
  const [tilt, setTilt] = useState(0)

  useEffect(() => {
    setTilt((Math.random() - 0.5) * 6)
  }, [])

  return (
    <motion.div
      className={`sketch-border rounded-lg border-4 border-ink bg-bg-card p-5 ${className}`}
      style={{ rotate: tilt, ...style }}
      whileHover={{ rotate: 0, scale: 1.03, y: -4, boxShadow: '6px 6px 0 var(--ink)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
