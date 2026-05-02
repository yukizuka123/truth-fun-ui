'use client'

import { useState, useEffect, useRef } from 'react'
import { calcBonusPool, bonusPerToken, effectiveReturn, buyQuote } from '@/lib/math'

interface DemoEvent {
  time: string
  label: string
  detail: string
  curvePrice: number
  bonusPool: number
  volume: number
  phase: string
}

const DEMO_SCRIPT: DemoEvent[] = [
  {
    time: 'T=0:00',
    label: 'Market Launch',
    detail: "KOL 'CryptoFelipe' 1-click-launches the market. Pool seed: 1,200 tfYES + $600 USDC. Price: $0.60",
    curvePrice: 0.60,
    bonusPool: 0,
    volume: 0,
    phase: 'EARLY',
  },
  {
    time: 'T=0:30',
    label: 'First Wave — Snipers',
    detail: 'Three early buyers put in $200 each on YES. Price: $0.60 → $0.72. Pseudo-leverage: 2.2x if holds to $1.00',
    curvePrice: 0.72,
    bonusPool: 6,
    volume: 600,
    phase: 'EARLY',
  },
  {
    time: 'T=2:00',
    label: 'FOMO Wave — Retail',
    detail: 'Tweet goes viral on X. $8,000 YES volume floods in. Price → $0.91. Early snipers can sell at 82% gain.',
    curvePrice: 0.91,
    bonusPool: 86,
    volume: 8600,
    phase: 'MID',
  },
  {
    time: 'T=12:00',
    label: 'Arb Closes the Gap',
    detail: 'DFlow base: $0.62. Curve: $0.91. Spread = $0.29. Arb bot fires on 500 tokens. Net arb profit: $140. Protocol: $29 → Bonus Pool.',
    curvePrice: 0.71,
    bonusPool: 115,
    volume: 23600,
    phase: 'MID',
  },
  {
    time: 'T=13:30',
    label: 'b-Stiffening + Fog of War',
    detail: 'Protocol injects liquidity. Pool depth increased — price hard to move. Fog-of-War: exact resolution moment randomised within 2-min window.',
    curvePrice: 0.68,
    bonusPool: 115,
    volume: 23600,
    phase: 'FOG',
  },
  {
    time: 'T=15:00',
    label: 'Resolution',
    detail: 'Elon tweets. Kalshi settles YES at $1.00. Winning tfYES holders receive $1.00 + $0.011 bonus per token.',
    curvePrice: 1.0,
    bonusPool: 115,
    volume: 23600,
    phase: 'SETTLED',
  },
]

const PHASE_COLORS: Record<string, string> = {
  EARLY: '#22C55E',
  MID: '#FACC15',
  LATE: '#EF4444',
  FOG: '#FB923C',
  SETTLED: '#A78BFA',
}

const PHASE_DOTS: Record<string, string> = {
  EARLY: '🟢',
  MID: '🟡',
  LATE: '🔴',
  FOG: '⚡',
  SETTLED: '✅',
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const event = DEMO_SCRIPT[currentStep]
  const nextEvent = DEMO_SCRIPT[currentStep + 1]

  const bpt = bonusPerToken(event.bonusPool, 10000)
  const effReturn = effectiveReturn(bpt, 0.6)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1
          return next
        })
        setCurrentStep((s) => {
          if (s < DEMO_SCRIPT.length - 1) return s + 1
          setIsPlaying(false)
          return s
        })
      }, 2000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying])

  const reset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
    setElapsed(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          The 15-Minute Truth Sprint
        </h1>
        <p className="font-mono text-sm" style={{ color: '#94A3B8' }}>
          "Will Elon Musk tweet about Bitcoin in the next 15 minutes?"
        </p>
      </div>

      {/* Main demo card */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#111118',
          border: `1px solid ${PHASE_COLORS[event.phase]}40`,
          boxShadow: `0 0 40px ${PHASE_COLORS[event.phase]}10`,
        }}
      >
        {/* Time + phase */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-white">{event.time}</span>
            <span className="text-xl">{PHASE_DOTS[event.phase]}</span>
            <span
              className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded"
              style={{
                color: PHASE_COLORS[event.phase],
                backgroundColor: `${PHASE_COLORS[event.phase]}18`,
              }}
            >
              {event.phase}
            </span>
          </div>
          <span className="text-lg font-semibold" style={{ color: PHASE_COLORS[event.phase] }}>
            {event.label}
          </span>
        </div>

        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          {event.detail}
        </p>

        {/* Live stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
              Curve Price
            </p>
            <p
              className="font-mono text-3xl font-bold"
              style={{ color: PHASE_COLORS[event.phase] }}
            >
              ${event.curvePrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
              Bonus Pool
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#22C55E' }}>
              ${event.bonusPool.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
              Volume
            </p>
            <p className="font-mono text-3xl font-bold text-white">
              ${(event.volume / 1000).toFixed(1)}K
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
              Est. Return
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#22C55E' }}>
              {effReturn.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* Bonus math at resolution */}
        {event.phase === 'SETTLED' && (
          <div
            className="mt-6 rounded-lg p-4"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <p className="font-mono text-sm font-semibold mb-2" style={{ color: '#22C55E' }}>
              Resolution Payout Breakdown
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <p style={{ color: '#475569' }}>Base payout</p>
                <p className="text-white">$1.00 per token</p>
              </div>
              <div>
                <p style={{ color: '#475569' }}>Bonus per token</p>
                <p style={{ color: '#22C55E' }}>+${bpt.toFixed(4)}</p>
              </div>
              <div>
                <p style={{ color: '#475569' }}>Total per token</p>
                <p className="text-white">${(1.0 + bpt).toFixed(4)}</p>
              </div>
              <div>
                <p style={{ color: '#475569' }}>Effective return</p>
                <p className="font-bold" style={{ color: '#22C55E' }}>{effReturn.toFixed(2)}x</p>
              </div>
            </div>
            <p className="text-xs mt-3 font-mono" style={{ color: '#475569' }}>
              Early sniper: $200 @ $0.60 → 333 tokens → $336.67 total (1.68x)
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
      >
        <p className="text-xs uppercase tracking-widest font-mono mb-4" style={{ color: '#94A3B8' }}>
          Timeline
        </p>
        <div className="space-y-2">
          {DEMO_SCRIPT.map((e, i) => (
            <button
              key={i}
              onClick={() => { setCurrentStep(i); setIsPlaying(false) }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
              style={{
                backgroundColor: i === currentStep ? `${PHASE_COLORS[e.phase]}18` : 'transparent',
                border: `1px solid ${i === currentStep ? `${PHASE_COLORS[e.phase]}40` : 'transparent'}`,
              }}
            >
              <span className="font-mono text-xs w-16 shrink-0" style={{ color: '#475569' }}>
                {e.time}
              </span>
              <span className="text-sm">{PHASE_DOTS[e.phase]}</span>
              <span
                className="text-sm font-medium"
                style={{ color: i === currentStep ? PHASE_COLORS[e.phase] : '#94A3B8' }}
              >
                {e.label}
              </span>
              <span className="ml-auto font-mono text-xs" style={{ color: '#475569' }}>
                ${e.curvePrice.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2.5 rounded-lg font-mono text-sm transition-all"
          style={{
            backgroundColor: '#1A1A26',
            color: currentStep === 0 ? '#475569' : '#94A3B8',
            border: '1px solid #2A2A3A',
          }}
        >
          ← Prev
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-6 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all"
          style={{
            backgroundColor: isPlaying ? 'rgba(239,68,68,0.15)' : '#22C55E',
            color: isPlaying ? '#EF4444' : '#000',
            border: isPlaying ? '1px solid rgba(239,68,68,0.3)' : 'none',
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Auto-play'}
        </button>
        <button
          onClick={() => setCurrentStep((s) => Math.min(DEMO_SCRIPT.length - 1, s + 1))}
          disabled={currentStep === DEMO_SCRIPT.length - 1}
          className="px-4 py-2.5 rounded-lg font-mono text-sm transition-all"
          style={{
            backgroundColor: '#1A1A26',
            color: currentStep === DEMO_SCRIPT.length - 1 ? '#475569' : '#94A3B8',
            border: '1px solid #2A2A3A',
          }}
        >
          Next →
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-lg font-mono text-sm transition-colors"
          style={{ backgroundColor: '#1A1A26', color: '#475569', border: '1px solid #2A2A3A' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
