'use client'

import { FloatingDoodles } from '@/components/ui/FloatingDoodles'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { MarqueeTicker } from '@/components/ui/MarqueeTicker'
import { FeaturedMarkets } from '@/components/landing/FeaturedMarkets'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ThreeGames } from '@/components/landing/ThreeGames'
import { LiveSprintDemo } from '@/components/landing/LiveSprintDemo'
import { StatsSection } from '@/components/landing/StatsSection'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { useDashboard } from '@/lib/queries'
import type { DFlowEvent } from '@/lib/dflow/types'
import { getPrimaryMarket, getPrice } from '@/lib/dflow/marketUtils'

function extractTickerItem(event: DFlowEvent, idx: number) {
  const m = getPrimaryMarket(event)
  const yesPrice = getPrice(m?.yesAsk, m?.yesBid) ?? 0
  const noPrice = getPrice(m?.noAsk, m?.noBid) ?? 0
  const vol = parseFloat(event.volume24hFp ?? '0') || (event.volume24h ?? undefined)
  return {
    id: event.ticker,
    question: event.title,
    yesPrice,
    noPrice,
    vol: vol != null && vol > 0 ? Math.round(vol) : undefined,
    hot: idx === 0,
  }
}

export default function Home() {
  const { data, isLoading } = useDashboard()

  // topActive is sorted by 24h volume desc — use first 4 as featured cards
  const featuredEvents: DFlowEvent[] = data?.topActive?.slice(0, 4) ?? []
  // fill the ticker strip from topActive tail + recent, deduplicated by ticker
  const seen = new Set(featuredEvents.map((e: DFlowEvent) => e.ticker))
  const tickerPool: DFlowEvent[] = [
    ...(data?.topActive ?? []).slice(4),
    ...(data?.recent ?? []),
  ].filter((e: DFlowEvent) => !seen.has(e.ticker))
  const tickerItems = tickerPool.slice(0, 5).map(extractTickerItem)

  return (
    <>
      <FloatingDoodles />
      <Navbar />
      <Hero />
      {tickerItems.length > 0 && <MarqueeTicker items={tickerItems} />}
      <FeaturedMarkets events={featuredEvents} loading={isLoading} />
      <HowItWorks />
      <ThreeGames />
      <LiveSprintDemo />
      <StatsSection />
      <CTASection />
      <Footer />
    </>
  )
}
