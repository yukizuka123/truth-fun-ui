'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface SketchButtonProps {
  children: React.ReactNode
  primary?: boolean
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

export function SketchButton({
  children,
  primary = true,
  onClick,
  className = '',
  style = {},
}: SketchButtonProps) {
  return (
    <motion.button
      whileHover={{ rotate: -2, scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 12 }}
      onClick={onClick}
      className={`sketch-border font-display font-semibold text-lg px-8 py-3.5 rounded-lg border-4 border-ink transition-all duration-200 ${className}`}
      style={{
        backgroundColor: primary ? 'var(--ink)' : 'transparent',
        color: primary ? 'var(--bg)' : 'var(--ink)',
        boxShadow: primary ? '0 4px 12px rgba(245, 237, 224, 0.15)' : 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(91, 163, 255, 0.4), 0 0 20px rgba(91, 163, 255, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 237, 224, 0.15)'
        }
      }}
    >
      {children}
    </motion.button>
  )
}
