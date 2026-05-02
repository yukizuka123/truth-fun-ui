'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LandingMarketCard } from './LandingMarketCard'
import type { DFlowEvent } from '@/lib/dflow/types'
import { getPrimaryMarket, getPrice } from '@/lib/dflow/marketUtils'

function getEventPrices(event: DFlowEvent) {
  const m = getPrimaryMarket(event)
  return {
    yesPrice: getPrice(m?.yesAsk, m?.yesBid),
    noPrice: getPrice(m?.noAsk, m?.noBid),
  }
}

function getTimeLeft(event: DFlowEvent): string {
  const market = event.markets?.[0]
  if (!market) {
    if (event.strikeDate) {
      const ms = event.strikeDate - Date.now()
      if (ms <= 0) return 'Ended'
      const h = Math.floor(ms / (1000 * 60 * 60))
      const d = Math.floor(h / 24)
      if (d > 0) return `${d}d left`
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
      return h > 0 ? `${h}h ${m}m left` : `${m}m left`
    }
    return 'Active'
  }
  const ms = market.closeTime * 1000 - Date.now()
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / (1000 * 60 * 60))
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d left`
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

function SkeletonCard() {
  return (
    <div className="sketch-border border-2 border-border rounded-xl p-5 bg-bg-card">
      <div className="h-3 bg-border rounded mb-3 w-2/3 animate-pulse" />
      <div className="h-5 bg-border rounded mb-2 animate-pulse" />
      <div className="h-4 bg-border rounded mb-6 w-4/5 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-14 bg-border rounded-lg animate-pulse" />
        <div className="h-14 bg-border rounded-lg animate-pulse" />
      </div>
      <div className="h-3 bg-border rounded w-1/2 animate-pulse" />
    </div>
  )
}

interface FeaturedMarketsProps {
  events: DFlowEvent[]
  loading: boolean
}

export function FeaturedMarkets({ events, loading }: FeaturedMarketsProps) {
  return (
    <section id="markets" className="py-20 md:py-24 px-6 bg-bg max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        <h2 className="font-display font-black text-4xl md:text-5xl text-ink mb-4">Featured Markets</h2>
        <p className="font-body text-lg md:text-xl text-ink-light">Trade on the prediction markets everyone's talking about</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.1 }}
              >
                <SkeletonCard />
              </motion.div>
            ))
          : events.map((event, idx) => {
              const { yesPrice, noPrice } = getEventPrices(event)
              const oi = parseFloat(event.openInterestFp ?? '0') || (event.openInterest ?? 0)
              const bonus = Math.round(oi)
              const timeLeft = getTimeLeft(event)

              return (
                <motion.div
                  key={event.ticker}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.1 }}
                >
                  <LandingMarketCard
                    question={event.title}
                    yesPrice={yesPrice}
                    noPrice={noPrice}
                    bonus={bonus}
                    timeLeft={timeLeft}
                    index={idx}
                    hot={idx === 0}
                    eventTicker={event.ticker}
                  />
                </motion.div>
              )
            })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
        className="text-center"
      >
        <Link
          href="/markets"
          className="font-display font-bold text-lg text-accent-blue border-b-2 border-dashed border-accent-blue hover:text-accent-purple hover:border-accent-purple transition-colors"
        >
          View All Markets →
        </Link>
      </motion.div>
    </section>
  )
}
