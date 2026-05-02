'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import WalletButton from '@/components/WalletButton'

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = (localStorage.getItem('tf-theme') as 'dark' | 'light' | null) || 'dark'
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('tf-theme', newTheme)
  }

  return (
    <motion.nav
      className="sketch-border fixed top-0 left-0 right-0 z-100 border-b-4 border-dashed border-ink"
      style={{ backgroundColor: scrolled ? 'var(--bg-secondary)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none' }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-ink">
            truth<span className="text-accent-blue">.fun</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#markets" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Markets</Link>
          <Link href="#how-it-works" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">How It Works</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Leaderboard</Link>
          <Link href="#" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          {mounted && (
            <motion.button onClick={toggle} whileHover={{ rotate: 20, scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="sketch-border w-9 h-9 rounded-lg border-2 border-border-strong flex items-center justify-center text-ink text-base">
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>
          )}
          <div className="hidden md:block">
            <WalletButton />
          </div>
          <motion.button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5">
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 10 : 0 }} transition={{ duration: 0.3 }} />
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ opacity: menuOpen ? 0 : 1 }} transition={{ duration: 0.3 }} />
            <motion.span className="block w-6 h-0.5 bg-ink" animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -10 : 0 }} transition={{ duration: 0.3 }} />
          </motion.button>
        </div>
      </div>
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0 }} transition={{ duration: 0.3 }} className="md:hidden overflow-hidden border-t-2 border-dashed border-border">
        <div className="px-6 py-4 flex flex-col gap-4 bg-bg-secondary">
          <Link href="#markets" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors" onClick={() => setMenuOpen(false)}>Markets</Link>
          <Link href="#how-it-works" className="font-ui text-sm font-medium text-ink-light hover:text-ink transition-colors" onClick={() => setMenuOpen(false)}>How It Works</Link>
          <WalletButton />
        </div>
      </motion.div>

    </motion.nav>
  )
}
