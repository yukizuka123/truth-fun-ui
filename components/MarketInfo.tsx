'use client'

import { MarketDetail } from '@/lib/dflow'
import { timeRemainingLabel } from '@/lib/math'

const TYPE_LABELS: Record<string, string> = {
  TRUTH_SPRINT: 'TRUTH SPRINT',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
}

const TYPE_COLORS: Record<string, string> = {
  TRUTH_SPRINT: '#8B5CF6',
  DAILY: '#22C55E',
  WEEKLY: '#94A3B8',
}

interface Props {
  market: MarketDetail
  fogActive?: boolean
}

export default function MarketInfo({ market, fogActive = false }: Props) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <p className="text-xs uppercase tracking-widest font-mono" style={{ color: '#94A3B8' }}>
        Market Info
      </p>

      <div>
        <p className="text-white font-semibold leading-snug">{market.question}</p>
        <p className="text-xs mt-1 font-mono" style={{ color: '#475569' }}>
          Settled by Kalshi · Payout: $1.00 + Bonus Pool share
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>
            Market Type
          </p>
          <span
            className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded"
            style={{
              color: TYPE_COLORS[market.type],
              backgroundColor: `${TYPE_COLORS[market.type]}18`,
            }}
          >
            {TYPE_LABELS[market.type]}
          </span>
        </div>
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>
            Resolution
          </p>
          <p className="text-sm font-mono text-white">
            {fogActive ? (
              <span style={{ color: '#FB923C' }}>⚡ Fog of War</span>
            ) : (
              timeRemainingLabel(market.endsAt)
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>
            Pool Seed (x₀)
          </p>
          <p className="text-sm font-mono text-white">{market.seedX.toLocaleString()} tfYES</p>
        </div>
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>
            Reserve Seed (y₀)
          </p>
          <p className="text-sm font-mono text-white">${market.seedY.toLocaleString()} USDC</p>
        </div>
      </div>

      {market.status === 'DETERMINED' && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <p className="text-xs font-mono" style={{ color: '#22C55E' }}>
            ✓ Market resolved · {market.resolution} wins
          </p>
        </div>
      )}
    </div>
  )
}
