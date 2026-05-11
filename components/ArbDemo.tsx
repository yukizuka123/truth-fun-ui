'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useCurveState } from '@/hooks/useCurveState'
import { useLivePrice } from '@/hooks/useLivePrice'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

interface Props {
  marketId: string
  dflowBasePrice: number
}

interface ArbExecutedEvent {
  direction?: string
  sizeUsd?: number
  spreadBps?: number
  profitUsd?: number
  bonusPoolCaptureUsd?: number
  txSig?: string | null
}

interface DemoSummary {
  startedAt: number
  endedAt: number
  durationSec: number
  sizeUsd: number
  arbs: ArbExecutedEvent[]
  bonusPoolDeltaUsd: number
  initialOracleBps: number | null
  finalOracleBps: number | null
  stubbed: boolean
}

export default function ArbDemo({ marketId, dflowBasePrice }: Props) {
  const { curvePrice } = useCurveState(marketId)
  const liveBase = useLivePrice(marketId)
  const [isRunning, setIsRunning] = useState(false)
  const [arbLog, setArbLog] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [demoMode, setDemoMode] = useState<'real' | 'mock'>('real')

  const curve = curvePrice ?? dflowBasePrice
  const base = liveBase ?? dflowBasePrice
  const spread = curve - base
  const tokens = 500
  const arbProfit = Math.abs(spread) * tokens
  const protocolCapture = arbProfit * 0.2

  // The backend /api/arb/demo only runs against the configured ticker — we expose
  // it via /api/config so the UI can warn when the user opens a different market.
  const { data: config } = useSWR<{ arbTicker: string | null }>(
    'arb-config',
    async () => {
      const res = await fetch(`${BACKEND_URL}/api/config`)
      if (!res.ok) return { arbTicker: null }
      // The /api/config endpoint doesn't expose the arb ticker yet; fall back to env-driven default.
      return { arbTicker: null }
    },
    { revalidateOnFocus: false },
  )

  // Tiny ticker config endpoint — added to surface configuredTicker() to the UI.
  const { data: arbTickerData } = useSWR<{ ticker: string | null }>(
    'arb-ticker',
    () => fetch(`${BACKEND_URL}/api/arb/ticker`).then((r) => (r.ok ? r.json() : { ticker: null })),
    { revalidateOnFocus: false },
  )
  const arbTicker = arbTickerData?.ticker ?? null
  const tickerMatches = arbTicker == null ? true : arbTicker === marketId

  // Auto-pick mode: if the user is on the configured arb ticker, default to real.
  // Otherwise the real demo would run against a different market — fall back to
  // the local-only animation so the button still does something.
  useEffect(() => {
    setDemoMode(tickerMatches ? 'real' : 'mock')
  }, [tickerMatches])
  void config

  const runMockArb = async () => {
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
  }

  const runRealArb = async () => {
    setArbLog([
      `Starting backend arb demo against ${arbTicker ?? 'configured ticker'}…`,
      `T+0  align curve to oracle`,
      `T+5  retail wallet seeds tfYES (drives curve up ~12c)`,
      `T+30 bot executes Direction A (real on-chain tx)`,
      `T+60 oracle shock (priceBps += 1500)`,
      `T+80 bot executes Direction B (real on-chain tx)`,
      `T+120 wait for convergence…`,
    ])
    const res = await fetch(`${BACKEND_URL}/api/arb/demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `backend ${res.status}`)
    }
    const summary = (await res.json()) as DemoSummary
    setArbLog((prev) => [
      ...prev,
      `--- demo complete ---`,
      `size: $${summary.sizeUsd} per leg`,
      `direction A: ${formatArb(summary.arbs[0])}`,
      `direction B: ${formatArb(summary.arbs[1])}`,
      `bonus pool delta: +$${summary.bonusPoolDeltaUsd.toFixed(4)} ✓`,
      `oracle bps: ${summary.initialOracleBps} → ${summary.finalOracleBps}`,
      `duration: ${summary.durationSec}s · stubbed=${summary.stubbed}`,
    ])
  }

  const runArb = async () => {
    setIsRunning(true)
    setArbLog([])
    try {
      if (demoMode === 'real') {
        await runRealArb()
      } else {
        await runMockArb()
      }
    } catch (e) {
      setArbLog((prev) => [...prev, `error: ${(e as Error).message}`])
    } finally {
      setIsRunning(false)
    }
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
              {arbLog.map((line, i) => {
                const isError = line.startsWith('error:')
                const color = isError
                  ? '#EF4444'
                  : line.includes('✓')
                    ? '#22C55E'
                    : '#94A3B8'
                return (
                  <p
                    key={i}
                    style={{ color, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                  >
                    {line}
                  </p>
                )
              })}
              {isRunning && (
                <p style={{ color: '#FACC15' }}>●▸ Running…</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono">
            <span style={{ color: '#475569' }}>Mode</span>
            <button
              onClick={() => setDemoMode('real')}
              disabled={!tickerMatches || isRunning}
              className="px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: demoMode === 'real' ? 'rgba(34,197,94,0.15)' : '#1A1A26',
                color: demoMode === 'real' ? '#22C55E' : '#94A3B8',
                border: `1px solid ${demoMode === 'real' ? 'rgba(34,197,94,0.3)' : '#2A2A3A'}`,
                cursor: !tickerMatches || isRunning ? 'not-allowed' : 'pointer',
                opacity: !tickerMatches ? 0.4 : 1,
              }}
            >
              Real (backend)
            </button>
            <button
              onClick={() => setDemoMode('mock')}
              disabled={isRunning}
              className="px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: demoMode === 'mock' ? 'rgba(168,139,250,0.15)' : '#1A1A26',
                color: demoMode === 'mock' ? '#A78BFA' : '#94A3B8',
                border: `1px solid ${demoMode === 'mock' ? 'rgba(168,139,250,0.3)' : '#2A2A3A'}`,
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              Mock (UI only)
            </button>
            {!tickerMatches && arbTicker && (
              <span style={{ color: '#94A3B8' }}>
                · backend arb is wired to <code>{arbTicker}</code>; open that market to run real
              </span>
            )}
          </div>

          <button
            onClick={runArb}
            disabled={isRunning || (demoMode === 'mock' && spread === 0)}
            className="w-full py-3 rounded-lg font-mono text-sm font-semibold transition-all"
            style={{
              backgroundColor:
                isRunning || (demoMode === 'mock' && spread === 0)
                  ? '#1A1A26'
                  : demoMode === 'real'
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(250,204,21,0.15)',
              color:
                isRunning || (demoMode === 'mock' && spread === 0)
                  ? '#475569'
                  : demoMode === 'real'
                    ? '#22C55E'
                    : '#FACC15',
              border: `1px solid ${isRunning || (demoMode === 'mock' && spread === 0) ? '#2A2A3A' : demoMode === 'real' ? 'rgba(34,197,94,0.3)' : 'rgba(250,204,21,0.3)'}`,
              cursor: isRunning || (demoMode === 'mock' && spread === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning
              ? demoMode === 'real'
                ? 'Backend arb demo running (~2 min)…'
                : 'Arb script running…'
              : demoMode === 'real'
                ? '▶ Run Backend Arb Demo (~2 min)'
                : '▶ Run Arb Script (UI only)'}
          </button>
        </div>
      )}
    </div>
  )
}

function formatArb(a: ArbExecutedEvent | undefined): string {
  if (!a) return '(no result)'
  const dir = a.direction ?? '?'
  const profit = a.profitUsd != null ? `$${a.profitUsd.toFixed(4)}` : '?'
  const cap = a.bonusPoolCaptureUsd != null ? `$${a.bonusPoolCaptureUsd.toFixed(4)}` : '?'
  const sig = a.txSig ? ` tx=${a.txSig.slice(0, 8)}…` : ''
  return `dir=${dir} profit=${profit} bonus_capture=${cap}${sig}`
}
