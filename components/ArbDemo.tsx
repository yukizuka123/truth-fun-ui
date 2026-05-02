'use client'

import { useState } from 'react'
import { useCurveState } from '@/hooks/useCurveState'
import { useLivePrice } from '@/hooks/useLivePrice'

interface Props {
  marketId: string
  dflowBasePrice: number
}

export default function ArbDemo({ marketId, dflowBasePrice }: Props) {
  const { curvePrice } = useCurveState(marketId)
  const liveBase = useLivePrice(marketId)
  const [isRunning, setIsRunning] = useState(false)
  const [arbLog, setArbLog] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const curve = curvePrice ?? dflowBasePrice
  const base = liveBase ?? dflowBasePrice
  const spread = curve - base
  const tokens = 500
  const arbProfit = Math.abs(spread) * tokens
  const protocolCapture = arbProfit * 0.2

  const runArb = async () => {
    setIsRunning(true)
    setArbLog([])

    const steps =
      spread > 0
        ? [
            `Detected spread: curve $${curve.toFixed(4)} > DFlow base $${base.toFixed(4)}`,
            `Direction 1: Buying ${tokens} tfYES at DFlow base ($${base.toFixed(4)})...`,
            `Depositing tokens to truth.fun bonding curve vault...`,
            `Selling into curve at $${curve.toFixed(4)}...`,
            `Arb profit: $${(arbProfit * 0.8).toFixed(2)} (bot keeps 80%)`,
            `Protocol captures: $${protocolCapture.toFixed(2)} → Bonus Pool ✓`,
            `Spread closed. New curve price closer to DFlow base.`,
          ]
        : spread < 0
        ? [
            `Detected spread: curve $${curve.toFixed(4)} < DFlow base $${base.toFixed(4)}`,
            `Direction 2: Buying ${tokens} cheap tfYES on curve ($${curve.toFixed(4)})...`,
            `Redeeming via Redemption Reserve at TWAP ($${base.toFixed(4)})...`,
            `Selling base tokens on DFlow...`,
            `Arb profit: $${(Math.abs(arbProfit) * 0.8).toFixed(2)} (bot keeps 80%)`,
            `Protocol captures 0.5% redemption fee → Bonus Pool ✓`,
            `Spread closed. Curve price pushed back toward DFlow base.`,
          ]
        : [`Spread is zero — no arb opportunity at this moment.`]

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 700))
      setArbLog((prev) => [...prev, step])
    }
    setIsRunning(false)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ color: '#94A3B8' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-mono">ARB DEMO</span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ backgroundColor: '#1A1A26', color: '#FACC15' }}
          >
            {spread !== 0
              ? `${spread > 0 ? 'DIR 1' : 'DIR 2'} · $${Math.abs(spread).toFixed(4)}`
              : 'No spread'}
          </span>
        </div>
        <span className="text-xs font-mono">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #2A2A3A' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>Curve Price</p>
              <p className="font-mono font-bold" style={{ color: '#22C55E' }}>
                ${curve.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>DFlow Base</p>
              <p className="font-mono font-bold" style={{ color: '#A78BFA' }}>
                ${base.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>Spread</p>
              <p
                className="font-mono font-bold"
                style={{ color: Math.abs(spread) > 0.01 ? '#FACC15' : '#475569' }}
              >
                {spread >= 0 ? '+' : ''}${spread.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: '#475569' }}>
                Arb P&L (500 tokens)
              </p>
              <p className="font-mono font-bold" style={{ color: '#22C55E' }}>
                +${(arbProfit * 0.8).toFixed(2)}
              </p>
            </div>
          </div>

          <div
            className="rounded-lg p-4 text-xs font-mono space-y-1"
            style={{ backgroundColor: '#1A1A26' }}
          >
            {spread > 0 ? (
              <>
                <p style={{ color: '#94A3B8' }}>
                  Direction 1 (curve {'>'} base): Buy tfYES at DFlow ${base.toFixed(4)} →
                  deposit to vault → sell into curve at ${curve.toFixed(4)}
                </p>
                <p style={{ color: '#22C55E' }}>
                  Profit per token: ${(spread * 0.8).toFixed(4)}
                </p>
                <p style={{ color: '#FACC15' }}>
                  Protocol captures 20%: ${protocolCapture.toFixed(2)} → Bonus Pool
                </p>
              </>
            ) : spread < 0 ? (
              <>
                <p style={{ color: '#94A3B8' }}>
                  Direction 2 (curve {'<'} base): Buy tfYES on curve at $
                  {curve.toFixed(4)} → redeem via Reserve at ${base.toFixed(4)}
                </p>
                <p style={{ color: '#22C55E' }}>
                  Profit per token: ${(Math.abs(spread) * 0.8 - 0.005 * base).toFixed(4)}
                </p>
                <p style={{ color: '#FACC15' }}>
                  0.5% redemption fee → Bonus Pool
                </p>
              </>
            ) : (
              <p style={{ color: '#475569' }}>No arb opportunity — spread is zero.</p>
            )}
          </div>

          {arbLog.length > 0 && (
            <div
              className="rounded-lg p-4 space-y-1 font-mono text-xs"
              style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3A' }}
            >
              {arbLog.map((line, i) => (
                <p key={i} style={{ color: line.includes('✓') ? '#22C55E' : '#94A3B8' }}>
                  {line}
                </p>
              ))}
              {isRunning && (
                <p style={{ color: '#FACC15' }}>●▸ Running…</p>
              )}
            </div>
          )}

          <button
            onClick={runArb}
            disabled={isRunning || spread === 0}
            className="w-full py-3 rounded-lg font-mono text-sm font-semibold transition-all"
            style={{
              backgroundColor: isRunning || spread === 0 ? '#1A1A26' : 'rgba(250,204,21,0.15)',
              color: isRunning || spread === 0 ? '#475569' : '#FACC15',
              border: `1px solid ${isRunning || spread === 0 ? '#2A2A3A' : 'rgba(250,204,21,0.3)'}`,
              cursor: isRunning || spread === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning ? 'Arb script running…' : '▶ Run Arb Script'}
          </button>
        </div>
      )}
    </div>
  )
}
