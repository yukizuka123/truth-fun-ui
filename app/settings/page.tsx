'use client'

/**
 * Hidden ops page (no nav link). Lists every on-chain market with status,
 * winning side, and close_time, plus per-row actions to drive a market into
 * a chosen winning side or jump the surfpool clock past close_time.
 *
 * Replaces dropping to `pnpm dev market resolve <ticker> --winning-side ...`
 * during live demos — every action is one click + a confirm modal.
 */

import { useState } from 'react'
import useSWR from 'swr'
import {
  fetchOnchainMarkets,
  fetchOnchainSnapshot,
  resolveOnchainMarket,
  timeTravelChain,
  type OnchainMarketEntry,
  type OnchainCurveSnapshot,
} from '@/lib/anchor'

type WinningSide = 'yes' | 'no' | 'undecided'

interface MarketRow extends OnchainMarketEntry {
  snapshot: OnchainCurveSnapshot | null
}

async function fetchMarketRows(): Promise<MarketRow[]> {
  const markets = await fetchOnchainMarkets()
  // Pull each market's on-chain status in parallel.
  const snapshots = await Promise.all(
    markets.map((m) =>
      fetchOnchainSnapshot(m.kalshiTicker).catch(() => null),
    ),
  )
  return markets.map((m, i) => ({ ...m, snapshot: snapshots[i] ?? null }))
}

export default function SettingsPage() {
  const { data: rows, isLoading, mutate } = useSWR<MarketRow[]>(
    'settings-markets',
    fetchMarketRows,
    { refreshInterval: 5000, revalidateOnFocus: false },
  )

  const [pending, setPending] = useState<{ ticker: string; side: WinningSide } | null>(null)
  const [busyTicker, setBusyTicker] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function confirmResolve() {
    if (!pending) return
    const { ticker, side } = pending
    setBusyTicker(ticker)
    setToast(null)
    try {
      const result = await resolveOnchainMarket({
        kalshiTicker: ticker,
        winningSide: side,
        skipCloseCheck: true, // surfpool clock has been or will be advanced separately
      })
      setToast({
        kind: 'ok',
        text: `${ticker} resolved as ${side.toUpperCase()} · settle sig ${result.settleSig.slice(0, 12)}…`,
      })
      mutate()
    } catch (e) {
      setToast({ kind: 'err', text: friendlyError(e) })
    } finally {
      setBusyTicker(null)
      setPending(null)
    }
  }

  async function jumpToCloseTime(row: MarketRow) {
    setBusyTicker(row.kalshiTicker)
    setToast(null)
    try {
      const target = row.closeTime + 5
      const ok = await timeTravelChain(target)
      if (ok) {
        setToast({
          kind: 'ok',
          text: `Jumped on-chain clock to ${new Date(target * 1000).toISOString()} (now past ${row.kalshiTicker} close).`,
        })
      } else {
        setToast({
          kind: 'err',
          text: 'Time-travel returned ok=false — RPC may not support surfnet_timeTravel (mainnet/devnet). Wait for close_time normally.',
        })
      }
      mutate()
    } catch (e) {
      setToast({ kind: 'err', text: friendlyError(e) })
    } finally {
      setBusyTicker(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink pt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings · Market resolution</h1>
          <p className="text-sm font-mono mt-1" style={{ color: '#94A3B8' }}>
            Drive any on-chain market into a chosen winning side without leaving the browser.
            Localnet/devnet only — disabled on mainnet.
          </p>
        </div>

        {toast && (
          <div
            className="mb-4 p-3 rounded-lg text-xs font-mono break-all"
            style={{
              backgroundColor: toast.kind === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${toast.kind === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: toast.kind === 'ok' ? '#22C55E' : '#EF4444',
            }}
          >
            {toast.text}
          </div>
        )}

        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
        >
          <div
            className="grid gap-2 px-4 py-3 text-[10px] font-mono uppercase tracking-wide"
            style={{ color: '#64748B', borderBottom: '1px solid #2A2A3A', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 2.5fr' }}
          >
            <div>Ticker</div>
            <div>Status</div>
            <div>Winner</div>
            <div>Close time</div>
            <div className="text-right">Actions</div>
          </div>

          {isLoading && (
            <div className="px-4 py-6 text-sm font-mono" style={{ color: '#475569' }}>
              Loading markets…
            </div>
          )}

          {!isLoading && rows && rows.length === 0 && (
            <div className="px-4 py-6 text-sm font-mono" style={{ color: '#475569' }}>
              No on-chain markets in the registry.
            </div>
          )}

          {!isLoading &&
            rows?.map((row) => (
              <MarketRowView
                key={row.kalshiTicker}
                row={row}
                busy={busyTicker === row.kalshiTicker}
                onResolve={(side) => setPending({ ticker: row.kalshiTicker, side })}
                onTimeTravel={() => jumpToCloseTime(row)}
              />
            ))}
        </div>
      </div>

      {pending && (
        <ConfirmModal
          ticker={pending.ticker}
          side={pending.side}
          onConfirm={confirmResolve}
          onCancel={() => setPending(null)}
          busy={busyTicker !== null}
        />
      )}
    </div>
  )
}

interface MarketRowViewProps {
  row: MarketRow
  busy: boolean
  onResolve: (side: WinningSide) => void
  onTimeTravel: () => void
}

function MarketRowView({ row, busy, onResolve, onTimeTravel }: MarketRowViewProps) {
  const status = row.snapshot?.status ?? '—'
  const winningSide = row.snapshot?.winningSide ?? '—'
  const isResolved = status === 'resolved'
  const closeMs = row.closeTime * 1000
  const isPastClose = Date.now() >= closeMs
  const closeText = new Date(closeMs).toISOString().replace('T', ' ').slice(0, 19)

  return (
    <div
      className="grid gap-2 px-4 py-3 items-center text-xs font-mono"
      style={{ borderBottom: '1px solid #1A1A26', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 2.5fr' }}
    >
      <div className="truncate">
        <div className="text-white">{row.kalshiTicker}</div>
        <div className="text-[10px]" style={{ color: '#475569' }}>
          {row.truthFunMarket.slice(0, 6)}…{row.truthFunMarket.slice(-4)}
        </div>
      </div>
      <div>
        <StatusBadge text={status} resolved={isResolved} />
      </div>
      <div style={{ color: winningSide === '—' ? '#475569' : winningSide === 'yes' ? '#22C55E' : winningSide === 'no' ? '#EF4444' : '#A78BFA' }}>
        {winningSide.toUpperCase()}
      </div>
      <div style={{ color: isPastClose ? '#22C55E' : '#94A3B8' }}>
        {closeText}
        <div className="text-[10px]" style={{ color: '#475569' }}>
          {isPastClose ? 'past close' : `closes in ${formatRelative(closeMs - Date.now())}`}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        <ActionButton
          label="Skip to close"
          tone="purple"
          disabled={busy || isResolved || isPastClose}
          onClick={onTimeTravel}
        />
        <ActionButton
          label="Resolve YES"
          tone="green"
          disabled={busy || isResolved}
          onClick={() => onResolve('yes')}
        />
        <ActionButton
          label="Resolve NO"
          tone="red"
          disabled={busy || isResolved}
          onClick={() => onResolve('no')}
        />
        <ActionButton
          label="Resolve Undecided"
          tone="grey"
          disabled={busy || isResolved}
          onClick={() => onResolve('undecided')}
        />
      </div>
    </div>
  )
}

function StatusBadge({ text, resolved }: { text: string; resolved: boolean }) {
  const color = resolved ? '#22C55E' : text === 'active' ? '#A78BFA' : '#94A3B8'
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] tracking-wide uppercase"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      {text}
    </span>
  )
}

interface ActionButtonProps {
  label: string
  tone: 'green' | 'red' | 'purple' | 'grey'
  disabled: boolean
  onClick: () => void
}

function ActionButton({ label, tone, disabled, onClick }: ActionButtonProps) {
  const palette = {
    green: { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E', border: 'rgba(34,197,94,0.35)' },
    red: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444', border: 'rgba(239,68,68,0.35)' },
    purple: { bg: 'rgba(168,139,250,0.12)', fg: '#A78BFA', border: 'rgba(168,139,250,0.35)' },
    grey: { bg: '#1A1A26', fg: '#94A3B8', border: '#2A2A3A' },
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1.5 rounded text-[10px] tracking-wide transition-all"
      style={{
        backgroundColor: disabled ? '#1A1A26' : palette.bg,
        color: disabled ? '#475569' : palette.fg,
        border: `1px solid ${disabled ? '#2A2A3A' : palette.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

interface ConfirmModalProps {
  ticker: string
  side: WinningSide
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}

function ConfirmModal({ ticker, side, onConfirm, onCancel, busy }: ConfirmModalProps) {
  const sideColor =
    side === 'yes' ? '#22C55E' : side === 'no' ? '#EF4444' : '#A78BFA'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="rounded-xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-2">Confirm resolution</h2>
        <p className="text-sm font-mono mb-4" style={{ color: '#94A3B8' }}>
          Resolve <span className="text-white">{ticker}</span> as{' '}
          <span style={{ color: sideColor, fontWeight: 600 }}>{side.toUpperCase()}</span>?
        </p>
        <div
          className="text-xs font-mono p-3 rounded-lg mb-4"
          style={{ backgroundColor: '#1A1A26', color: '#94A3B8' }}
        >
          This calls <span style={{ color: '#A78BFA' }}>deposit_resolution_usdc</span> +{' '}
          <span style={{ color: '#A78BFA' }}>mark_resolved</span> from the keeper. Holders of
          the losing side will burn for $0; the winning side splits the resolution pot
          proportionally. Cannot be undone.
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-colors"
            style={{
              backgroundColor: '#1A1A26',
              color: '#94A3B8',
              border: '1px solid #2A2A3A',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors"
            style={{
              backgroundColor: busy ? '#1A1A26' : sideColor,
              color: busy ? '#475569' : '#000',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Resolving…' : `Resolve ${side.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatRelative(ms: number): string {
  if (ms <= 0) return '0s'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? 'Request failed')
  if (/MarketStillOpen/i.test(raw))
    return 'Market is still open on-chain — use "Skip to close" first.'
  if (/AlreadyResolved/i.test(raw))
    return 'This market is already resolved.'
  if (/STUB_PROGRAMS/i.test(raw))
    return 'Backend is in stub mode — restart with STUB_PROGRAMS=false.'
  return raw
}
