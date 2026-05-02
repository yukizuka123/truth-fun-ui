'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { SketchButton } from '@/components/ui/SketchButton'

export function CTASection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setEmail('')
      setSubmitted(false)
    }, 2000)
  }

  return (
    <section className="py-24 px-6 bg-bg-dark-section relative overflow-hidden">
      <motion.div className="absolute top-20 left-10 font-mono text-6xl opacity-5 pointer-events-none" animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        x·y=k
      </motion.div>
      <motion.div className="absolute bottom-20 right-10 font-mono text-5xl opacity-5 pointer-events-none" animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
        $1.00
      </motion.div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut' }} className="font-display font-black text-5xl md:text-6xl text-bg mb-8 leading-tight">
          Truth waits for{' '}
          <span className="text-accent-yellow">
            <motion.span animate={{ rotate: [-1, 1.5, -0.5, 1, -1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="inline-block origin-center">
              no one
            </motion.span>
          </span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }} className="font-body text-lg md:text-xl text-bg/80 mb-8">
          Join thousands of traders. Start with Truth Sprints, scale with yield.
        </motion.p>

        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }} className="flex flex-col md:flex-row gap-4 mb-8">
          <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="sketch-border flex-1 px-4 py-3 rounded-lg border-4 border-border bg-bg-card text-ink font-ui placeholder:text-ink-muted focus:outline-none focus:border-accent-blue transition-colors" />
          <SketchButton primary>Get Started</SketchButton>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: submitted ? 1 : 0, y: submitted ? 0 : 10 }} transition={{ duration: 0.3 }} className="font-display font-bold text-2xl text-accent-green">
          {submitted && '✓ Welcome to truth.fun!'}
        </motion.div>
      </div>
    </section>
  )
}
