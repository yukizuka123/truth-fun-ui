'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { SketchDivider } from '@/components/ui/SketchDivider'

const FOOTER_LINKS = [
  { label: 'Docs', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'X / Twitter', href: '#' },
  { label: 'Discord', href: '#' },
]

export function Footer() {
  return (
    <footer className="bg-bg-dark-section">
      <SketchDivider />
      <div className="px-6 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="font-display text-2xl font-bold text-bg">
                truth<span className="text-accent-blue">.fun</span>
              </span>
            </Link>
            <p className="font-body text-base text-bg/70">The pump.fun for prediction markets. Degen speed, regulated settlement.</p>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg text-bg mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="font-ui text-sm text-bg/70 hover:text-bg transition-colors">Markets</Link></li>
              <li><Link href="#" className="font-ui text-sm text-bg/70 hover:text-bg transition-colors">How It Works</Link></li>
              <li><Link href="#" className="font-ui text-sm text-bg/70 hover:text-bg transition-colors">Leaderboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg text-bg mb-4">Community</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}><Link href={link.href} className="font-ui text-sm text-bg/70 hover:text-bg transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }} className="sketch-border border-t-2 border-dashed border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-bg/60">© 2026 Truth.fun. Built on Solana.</div>
          <div className="sketch-border border-2 border-dashed border-border rounded-full px-4 py-1.5 font-mono text-xs font-bold text-bg">Built on Solana ⚡</div>
        </motion.div>
      </div>
    </footer>
  )
}
