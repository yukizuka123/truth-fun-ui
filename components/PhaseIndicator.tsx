'use client'

import { MarketPhase } from '@/lib/math'

interface PhaseConfig {
  label: string
  dot: string
  color: string
  barColor: string
}

const PHASES: Record<MarketPhase, PhaseConfig> = {
  EARLY: {
    label: 'High Sensitivity · Pseudo-Leverage Active',
    dot: '🟢',
    color: '#22C55E',
    barColor: '#22C55E',
  },
  MID: {
    label: 'Normal Depth · Arb Building Bonus Pool',
    dot: '🟡',
    color: '#FACC15',
    barColor: '#FACC15',
  },
  LATE: {
    label: 'Sniping Protection Active · Deep Pool',
    dot: '🔴',
    color: '#EF4444',
    barColor: '#EF4444',
  },
  FOG: {
    label: 'Resolution Window Open · Exact Time Hidden',
    dot: '⚡',
    color: '#FB923C',
    barColor: '#FB923C',
  },
}

interface Props {
  phase: MarketPhase
  progressPct: number
}

export default function PhaseIndicator({ phase, progressPct }: Props) {
  const config = PHASES[phase]

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: '#94A3B8' }}>
        Market Phase
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{config.dot}</span>
        <span className="font-mono text-sm text-white">{config.label}</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: '#1A1A26' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(progressPct, 100)}%`, backgroundColor: config.barColor }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs font-mono" style={{ color: '#475569' }}>
          EARLY
        </span>
        <span className="text-xs font-mono" style={{ color: '#475569' }}>
          LATE
        </span>
      </div>
    </div>
  )
}
