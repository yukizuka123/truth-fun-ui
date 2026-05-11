'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import type { DFlowEvent } from '@/lib/dflow/types'
import { getPrimaryMarket, getPrice } from '@/lib/dflow/marketUtils'

function getTimeLeft(event: DFlowEvent): string {
  const m = getPrimaryMarket(event)
  const closeMs = m ? m.closeTime * 1000 : (event.strikeDate ?? null)
  if (!closeMs) return 'Active'
  const ms = closeMs - Date.now()
  if (ms <= 0) return 'Ended'
  const d = Math.floor(ms / 86_400_000)
  if (d > 0) return `${d}d left`
  const h = Math.floor(ms / 3_600_000)
  if (h > 0) return `${h}h left`
  return `${Math.floor(ms / 60_000)}m left`
}

function fmt(v: string | number | null | undefined): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

interface MarketCardProps {
  event: DFlowEvent
  index?: number
}

export function MarketCard({ event, index = 0 }: MarketCardProps) {
  const primary = getPrimaryMarket(event)
  const yesPrice = getPrice(primary?.yesAsk, primary?.yesBid)
  const noPrice = getPrice(primary?.noAsk, primary?.noBid)
  const timeLeft = getTimeLeft(event)
  const vol24h = event.volume24hFp ?? event.volume24h
  const oi = event.openInterestFp ?? event.openInterest
  const extraMarkets = (event.markets?.length ?? 0) - 1

  const queryClient = useQueryClient()
  const prefetchEvent = () => {
    queryClient.prefetchQuery({
      queryKey: ['dflow', 'event', event.ticker],
      queryFn: () =>
        fetch(`/api/events/${encodeURIComponent(event.ticker)}`).then((r) => r.json()),
      staleTime: 15_000,
    })
  }

  return (
    <motion.div
      onMouseEnter={prefetchEvent}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(index * 0.04, 0.25) }}
      className="sketch-border border-2 border-border rounded-xl p-5 bg-bg-card flex flex-col gap-4 hover:border-accent-blue hover:shadow-[0_4px_20px_rgba(91,163,255,0.12)] transition-all duration-200"
    >
      {/* Series + time */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-muted bg-bg-secondary px-2 py-0.5 rounded border border-border truncate max-w-[60%]">
          {event.seriesTicker}
        </span>
        <span className="font-mono text-xs text-ink-muted whitespace-nowrap">{timeLeft}</span>
      </div>

      {/* Title */}
      <h3 className="font-display font-bold text-base text-ink leading-snug line-clamp-3 flex-1">
        {event.title}
      </h3>

      {/* YES / NO prices */}
      <div className="grid grid-cols-2 gap-2">
        <div className="sketch-border border-2 border-accent-green/50 rounded-lg py-2.5 text-center bg-accent-green/5">
          <div className="font-mono font-bold text-accent-green text-sm">YES</div>
          <div className="font-mono mt-0.5">
            {yesPrice !== null ? (
              <span className="text-sm text-ink font-bold">{(yesPrice * 100).toFixed(0)}¢</span>
            ) : (
              <span className="text-xs text-ink-muted">—</span>
            )}
          </div>
        </div>
        <div className="sketch-border border-2 border-accent-red/50 rounded-lg py-2.5 text-center bg-accent-red/5">
          <div className="font-mono font-bold text-accent-red text-sm">NO</div>
          <div className="font-mono mt-0.5">
            {noPrice !== null ? (
              <span className="text-sm text-ink font-bold">{(noPrice * 100).toFixed(0)}¢</span>
            ) : (
              <span className="text-xs text-ink-muted">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="border-t-2 border-dashed border-border pt-3 flex items-center justify-between">
        <div className="flex gap-4 text-xs font-mono">
          <span className="text-ink-muted">
            24h <span className="text-ink font-bold">{fmt(vol24h)}</span>
          </span>
          <span className="text-ink-muted">
            OI <span className="text-accent-purple font-bold">{fmt(oi)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {extraMarkets > 0 && (
            <span className="font-mono text-xs text-ink-muted">+{extraMarkets} more</span>
          )}
          <Link
            href={`/markets/${primary?.ticker ?? event.ticker}`}
            className="font-ui font-medium text-xs text-accent-blue hover:text-accent-purple transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function MarketCardSkeleton() {
  return (
    <div className="sketch-border border-2 border-border rounded-xl p-5 bg-bg-card flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-border rounded animate-pulse" />
        <div className="h-4 w-14 bg-border rounded animate-pulse" />
      </div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-border rounded animate-pulse" />
        <div className="h-4 bg-border rounded w-4/5 animate-pulse" />
        <div className="h-4 bg-border rounded w-3/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 bg-border rounded-lg animate-pulse" />
        <div className="h-14 bg-border rounded-lg animate-pulse" />
      </div>
      <div className="border-t-2 border-dashed border-border pt-3">
        <div className="h-3 bg-border rounded w-2/3 animate-pulse" />
      </div>
    </div>
  )
}
