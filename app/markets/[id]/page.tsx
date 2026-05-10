import Link from 'next/link'
import { getMarket } from '@/lib/dflow'
import { getMarketPhase, progressPercent } from '@/lib/math'
import PriceChart from '@/components/PriceChart'
import TradePanel from '@/components/TradePanel'
import BonusPoolTracker from '@/components/BonusPoolTracker'
import BonusPoolChart from '@/components/BonusPoolChart'
import PhaseIndicator from '@/components/PhaseIndicator'
import MarketInfo from '@/components/MarketInfo'
import ArbDemo from '@/components/ArbDemo'
import WalletNetworkHint from '@/components/WalletNetworkHint'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params
  const market = await getMarket(id)

  const pct = progressPercent(market.endsAt, market.durationMs)
  const fogActive = pct >= 80
  const phase = getMarketPhase(pct, fogActive)

  return (
    <div className="min-h-screen bg-bg text-ink pt-20">
      <WalletNetworkHint />
      {/* Breadcrumb + question (sits under the global TopHeader) */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-b-2 border-dashed border-border">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/"
            className="font-ui text-sm font-medium transition-colors text-ink-light hover:text-ink"
          >
            ← Markets
          </Link>
          <span className="text-ink-muted">/</span>
          {(() => {
            const accent = market.type === 'TRUTH_SPRINT' ? 'var(--accent-purple)' : 'var(--accent-green)'
            return (
              <span
                className="font-ui text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg sketch-border border-2"
                style={{
                  color: accent,
                  borderColor: accent,
                  backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
                }}
              >
                {market.type.replace('_', ' ')}
              </span>
            )
          })()}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink leading-snug max-w-2xl">
          {market.question}
        </h1>
      </div>

      {/* Phase indicator */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PhaseIndicator phase={phase} progressPct={pct} />
      </div>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <PriceChart key={market.id} marketId={market.id} dflowBasePrice={market.yesPrice} />
            </div>
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <BonusPoolTracker marketId={market.id} entryPrice={market.yesPrice} />
            </div>
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <BonusPoolChart marketId={market.id} />
            </div>
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <ArbDemo marketId={market.id} dflowBasePrice={market.yesPrice} />
            </div>
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <MarketInfo market={market} fogActive={fogActive} />
            </div>
          </div>

          {/* Right column — Trade Panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="sketch-border border-3 border-border rounded-xl p-6 bg-bg-card">
              <TradePanel key={market.id} marketId={market.id} dflowBasePrice={market.yesPrice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
