'use client'

import { motion } from 'framer-motion'
import { SketchDivider } from '@/components/ui/SketchDivider'

const STEPS = [
  { number: 1, icon: '🎯', title: 'Pick a Side', description: 'Choose YES or NO on any prediction market question. Your early entry sets you up for curve gains.', color: '#72bf4e' },
  { number: 2, icon: '📈', title: 'Ride the Curve', description: 'As more traders enter, bonding curves propel prices. Your early position amplifies as FOMO kicks in.', color: '#4db3ff' },
  { number: 3, icon: '💰', title: 'Collect Your Truth', description: 'Winners redeem tokens for $1.00 guaranteed + a share of the bonus pool that other traders funded.', color: '#ffd54f' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-bg-dark-section">
      <SketchDivider />
      <div className="px-6 max-w-7xl mx-auto py-16">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }} className="text-center mb-16">
          <h2 className="font-display font-black text-4xl md:text-5xl text-bg mb-4">How It Works</h2>
          <p className="font-body text-lg md:text-xl text-bg/80">Three simple steps to start earning alpha</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {STEPS.map((step, idx) => (
            <motion.div key={step.number} initial={{ opacity: 0, y: 30, rotate: (idx - 1) * 1.5 }} whileInView={{ opacity: 1, y: 0, rotate: (idx - 1) * 1.5 }} whileHover={{ y: -8, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.15 }} className="sketch-border border-2 border-dashed border-border rounded-2xl p-8 bg-bg/50 text-center cursor-pointer">
              <motion.div className="text-6xl mb-4 inline-block" whileHover={{ rotate: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 0.5 }}>{step.icon}</motion.div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full font-mono font-bold text-white mb-4 text-lg" style={{ backgroundColor: step.color }}>{step.number}</div>
              <h3 className="font-display font-bold text-2xl text-bg mb-3">{step.title}</h3>
              <p className="font-body text-base text-bg/80 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <SketchDivider inverted />
    </section>
  )
}
