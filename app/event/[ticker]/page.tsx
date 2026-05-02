'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEvent } from '@/hooks/dflow/useEvent'
import type { Market } from '@/lib/dflow/types'

const TradesChart = dynamic(
  () => import('@/components/TradesChart').then((m) => m.TradesChart),
  { ssr: false, loading: () => (
    <div className="h-52 flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )},
)

function formatVolume(fp: string | null | undefined, fallback: number | null | undefined): string {
  const v = parseFloat(fp ?? '0') || (fallback ?? 0)
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
  if (v > 0) return `$${Math.round(v)}`
  return '—'
}

function getStatusBadgeClass(status: Market['status']): string {
  switch (status) {
    case 'active': return 'bg-accent-green/10 text-accent-green border-accent-green/30'
    case 'determined': return 'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
    case 'closed': return 'bg-accent-red/10 text-accent-red border-accent-red/30'
    default: return 'bg-border/30 text-ink-muted border-border'
  }
}

function MarketCard({ market }: { market: Market }) {
  const yesPrice = parseFloat(market.yesAsk ?? market.yesBid ?? '0.5') || 0.5
  const noPrice = parseFloat(market.noAsk ?? market.noBid ?? '0.5') || 0.5

  return (
    <div className="sketch-border border-2 border-border rounded-xl p-5 bg-bg-card hover:border-accent-blue transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeClass(market.status)}`}>
          {market.status}
        </span>
        <span className="font-ui text-xs text-ink-muted truncate max-w-[140px]">{market.ticker}</span>
      </div>

      <h3 className="font-display font-bold text-base text-ink mb-1 leading-snug">{market.title}</h3>
      {market.subtitle && (
        <p className="font-body text-xs text-ink-muted mb-4 line-clamp-2">{market.subtitle}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg p-3 border-2 border-accent-green text-center bg-bg">
          <div className="font-mono font-bold text-accent-green text-xl">${yesPrice.toFixed(2)}</div>
          <div className="font-ui text-xs text-ink-light mt-0.5 truncate">{market.yesSubTitle || 'YES'}</div>
        </div>
        <div className="rounded-lg p-3 border-2 border-accent-red text-center bg-bg">
          <div className="font-mono font-bold text-accent-red text-xl">${noPrice.toFixed(2)}</div>
          <div className="font-ui text-xs text-ink-light mt-0.5 truncate">{market.noSubTitle || 'NO'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs border-t-2 border-dashed border-border pt-3">
        <span className="text-ink-muted font-ui">
          Vol: <span className="font-mono text-ink font-semibold">{formatVolume(market.volumeFp, market.volume)}</span>
        </span>
        <Link
          href={`/event/${encodeURIComponent(market.eventTicker)}`}
          className="font-display font-bold text-accent-blue hover:text-accent-purple transition-colors group-hover:translate-x-0.5 inline-block"
        >
          View →
        </Link>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-3 bg-border rounded w-20 mb-8 animate-pulse" />
        <div className="h-8 bg-border rounded w-2/3 mb-3 animate-pulse" />
        <div className="h-4 bg-border rounded w-1/2 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-52 bg-border rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EventPage() {
  const params = useParams()
  const ticker = typeof params.ticker === 'string' ? params.ticker : ''

  const { data: event, isLoading, isError } = useEvent(ticker, { withNestedMarkets: true })

  if (isLoading) return <LoadingSkeleton />

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-3xl font-black mb-2">Event not found</p>
          <p className="font-body text-ink-light mb-6">{ticker}</p>
          <Link href="/" className="font-display font-bold text-accent-blue hover:text-accent-purple transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const primaryMarket = event.markets?.[0]
  const activeMarkets = event.markets?.filter((m) => m.status === 'active') ?? []
  const allMarkets = event.markets ?? []

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-b-2 border-dashed border-border">
        <div className="flex items-center gap-2 mb-6 text-sm font-ui">
          <Link href="/" className="text-ink-light hover:text-ink transition-colors">← Home</Link>
          <span className="text-ink-muted">/</span>
          <span className="text-ink-muted font-mono">{event.ticker}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {event.imageUrl && (
            <Image
              src={event.imageUrl}
              alt={event.title}
              width={80}
              height={80}
              className="rounded-xl object-cover sketch-border border-2 border-border flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
                {event.seriesTicker}
              </span>
              {event.competition && (
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/30">
                  {event.competition}
                </span>
              )}
              {event.strikePeriod && (
                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-border/30 text-ink-muted border border-border">
                  {event.strikePeriod}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-ink leading-tight mb-2">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="font-body text-ink-light text-lg">{event.subtitle}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: '24h Volume', value: formatVolume(event.volume24hFp, event.volume24h) },
            { label: 'Open Interest', value: formatVolume(event.openInterestFp, event.openInterest) },
            { label: 'Liquidity', value: formatVolume(null, event.liquidity) },
            { label: 'Active Markets', value: `${activeMarkets.length} / ${allMarkets.length}` },
          ].map(({ label, value }) => (
            <div key={label} className="sketch-border border-2 border-border rounded-xl p-4 bg-bg-card text-center">
              <div className="font-mono font-bold text-xl text-ink">{value}</div>
              <div className="font-ui text-xs text-ink-muted mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price chart */}
      {primaryMarket && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Price History
            </h2>
            <span className="font-mono text-xs text-ink-muted">{primaryMarket.ticker}</span>
          </div>
          <div className="sketch-border border-2 border-border rounded-xl p-6 bg-bg-card">
            <div className="flex gap-4 mb-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-accent-green inline-block rounded" />
                <span className="text-ink-light">YES</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-accent-red inline-block rounded" />
                <span className="text-ink-light">NO</span>
              </span>
            </div>
            <TradesChart marketTicker={primaryMarket.ticker} />
          </div>
        </div>
      )}

      {/* Markets grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="font-display font-bold text-xl text-ink mb-6">
          Markets <span className="text-ink-muted font-mono text-base">({allMarkets.length})</span>
        </h2>

        {allMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allMarkets.map((market) => (
              <MarketCard key={market.ticker} market={market} />
            ))}
          </div>
        ) : (
          <div className="sketch-border border-2 border-border rounded-xl p-12 text-center text-ink-muted font-ui">
            No markets available for this event yet
          </div>
        )}

        {/* Settlement sources */}
        {event.settlementSources && event.settlementSources.length > 0 && (
          <div className="mt-10 sketch-border border-2 border-border rounded-xl p-6 bg-bg-card">
            <h3 className="font-display font-bold text-base text-ink mb-3">Settlement Sources</h3>
            <div className="flex flex-wrap gap-4">
              {event.settlementSources.map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui text-sm text-accent-blue hover:text-accent-purple transition-colors underline underline-offset-2 decoration-dashed"
                >
                  {src.name} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
