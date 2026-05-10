'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCurveState } from '@/hooks/useCurveState'
import { useUserTokenBalances } from '@/hooks/useUserTokenBalances'
import { buyQuote, sellQuote, type CurveState } from '@/lib/math'
import {
  buyOnCurve,
  claimSidePayout,
  ensureOnchainMarket,
  sellOnCurve,
  type Side,
} from '@/lib/anchor'

type Tab = 'BUY YES' | 'BUY NO' | 'SELL YES' | 'SELL NO' | 'CLAIM'

const TABS: Tab[] = ['BUY YES', 'BUY NO', 'SELL YES', 'SELL NO', 'CLAIM']

interface Props {
  marketId: string
  /** DFlow's reference yes price (0..1). Used for the "fair price" badge. */
  dflowBasePrice: number
}

/**
 * Convert raw transaction errors into user-readable messages. Anchor surfaces
 * its custom errors via `error.error.errorCode.code` and the message also
 * embeds the variant name (e.g. "Error Code: MarketVoid"), so we string-match
 * against either path. Falls back to the raw message for unknown errors.
 */
function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? 'Transaction failed')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (e as any)?.error?.errorCode?.code ?? ''
  const haystack = `${code} ${raw}`
  if (/MarketVoid/i.test(haystack)) {
    return 'Market is void — your tokens stay in your wallet. Nothing was burned.'
  }
  if (/MarketNotResolved/i.test(haystack)) {
    return 'Market is not resolved yet — wait for the keeper to mark it resolved.'
  }
  if (/MarketClosed/i.test(haystack)) {
    return 'Market is closed — buys are no longer accepted.'
  }
  if (/SlippageExceeded/i.test(haystack)) {
    return 'Slippage exceeded. Try increasing the slippage tolerance and resubmitting.'
  }
  if (/InsufficientRealLiquidity/i.test(haystack)) {
    return 'Pool has no real USDC for this side yet — wait for buy volume to accumulate.'
  }
  if (/InsufficientLiquidity/i.test(haystack)) {
    return 'Pool has insufficient liquidity for this trade size.'
  }
  if (/ZeroAmount/i.test(haystack)) {
    return 'Amount must be greater than zero.'
  }
  return raw
}

function tabSide(tab: Tab): Side | null {
  if (tab === 'BUY YES' || tab === 'SELL YES') return 'YES'
  if (tab === 'BUY NO' || tab === 'SELL NO') return 'NO'
  return null
}

function isBuyTab(tab: Tab): boolean {
  return tab === 'BUY YES' || tab === 'BUY NO'
}

function isSellTab(tab: Tab): boolean {
  return tab === 'SELL YES' || tab === 'SELL NO'
}

export default function TradePanel({ marketId, dflowBasePrice }: Props) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const {
    yesCurve,
    noCurve,
    yesPrice,
    noPrice,
    status,
    winningSide,
    notRegistered,
    refresh,
  } = useCurveState(marketId)
  const {
    tfYes: userTfYes,
    tfNo: userTfNo,
    refresh: refreshBalances,
  } = useUserTokenBalances(marketId)

  const [activeTab, setActiveTab] = useState<Tab>('BUY YES')
  const [amount, setAmount] = useState('')
  // 2% default — the on-chain `buy_yes`/`sell_yes` apply 1% vig before the
  // curve math, so anything tighter risks SlippageExceeded under tiny rounding.
  const [slippage, setSlippage] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [txSig, setTxSig] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingMarket, setIsCreatingMarket] = useState(false)
  // CLAIM tab: which side the user wants to redeem. Defaults to the winning
  // side, but the user can flip to the losing side to dispose of dead tokens.
  const [claimSide, setClaimSide] = useState<Side>('YES')
  // Required when claiming the losing side — those tokens burn for $0, so we
  // make the user explicitly opt in.
  const [burnConfirmed, setBurnConfirmed] = useState(false)

  const isVoid = status === 'resolved' && winningSide === 'undecided'
  const winningSideUpper: Side | null =
    winningSide === 'yes' ? 'YES' : winningSide === 'no' ? 'NO' : null
  const isClaimingLoser =
    activeTab === 'CLAIM' && winningSideUpper !== null && claimSide !== winningSideUpper

  const parsedAmount = parseFloat(amount) || 0

  // The contract takes 1% vig off the top before running x·y=k math, so to
  // match what users actually get out, run the preview math on the post-vig
  // amount. Otherwise predicted tokensOut overshoots by ~1% and slippage
  // checks fail by a hair.
  const VIG = 0.01

  // Pick the curve relevant to the active tab.
  const sideCurve: CurveState | undefined =
    tabSide(activeTab) === 'YES' ? yesCurve : tabSide(activeTab) === 'NO' ? noCurve : undefined
  const sidePrice =
    tabSide(activeTab) === 'YES' ? yesPrice : tabSide(activeTab) === 'NO' ? noPrice : null

  const preview = (() => {
    if (!sideCurve || parsedAmount <= 0) return null
    if (isBuyTab(activeTab)) {
      // Vig is taken off the USDC input before the curve sees it.
      return buyQuote(sideCurve, parsedAmount * (1 - VIG))
    }
    if (isSellTab(activeTab)) {
      // Vig is taken off the gross USDC out after the curve math.
      const q = sellQuote(sideCurve, parsedAmount)
      return { ...q, usdcOut: q.usdcOut * (1 - VIG) }
    }
    return null
  })()

  async function handleCreateMarket() {
    setIsCreatingMarket(true)
    setError(null)
    try {
      await ensureOnchainMarket(marketId)
      refresh()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setIsCreatingMarket(false)
    }
  }

  async function handleTrade() {
    if (!wallet.connected) return
    if (!parsedAmount) return
    setIsLoading(true)
    setError(null)
    setTxSig(null)
    try {
      const side = tabSide(activeTab)
      let sig: string
      if (isBuyTab(activeTab) && side) {
        const minOut = preview ? (preview as { tokensOut: number }).tokensOut * (1 - slippage / 100) : 0
        sig = await buyOnCurve({
          connection,
          wallet,
          marketId,
          side,
          usdcIn: parsedAmount,
          minTokensOut: minOut,
        })
      } else if (isSellTab(activeTab) && side) {
        const minOut = preview ? (preview as { usdcOut: number }).usdcOut * (1 - slippage / 100) : 0
        sig = await sellOnCurve({
          connection,
          wallet,
          marketId,
          side,
          tokensIn: parsedAmount,
          minUsdcOut: minOut,
        })
      } else {
        sig = await claimSidePayout({
          connection,
          wallet,
          marketId,
          side: claimSide,
          amount: parsedAmount,
        })
      }
      setTxSig(sig)
      setAmount('')
      setBurnConfirmed(false)
      refresh()
      refreshBalances()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setIsLoading(false)
    }
  }

  function buttonLabel(): string {
    if (notRegistered) return 'Create market on-chain →'
    if (!wallet.connected) return 'Connect Wallet to Trade'
    if (isLoading) return 'Confirming…'
    if (status === 'resolved' && activeTab !== 'CLAIM') return 'Market resolved — switch to CLAIM'
    if (activeTab === 'CLAIM') {
      if (isClaimingLoser) return `Burn tf${claimSide} for $0 →`
      return `Claim tf${claimSide} →`
    }
    return `${activeTab} →`
  }

  const buttonDisabled = (() => {
    if (notRegistered) return false // we want this clickable
    if (!wallet.connected) return true
    if (isLoading) return true
    if (status === 'resolved' && activeTab !== 'CLAIM') return true
    if (activeTab === 'CLAIM' && isVoid) return true
    if (activeTab === 'CLAIM' && isClaimingLoser && !burnConfirmed) return true
    if (!parsedAmount) return true
    return false
  })()

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #2A2A3A' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setError(null)
              setTxSig(null)
              setAmount('')
              setBurnConfirmed(false)
              if (tab === 'CLAIM') {
                // Default claim side: prefer the winning side; if undecided/unknown,
                // default to whichever side the user actually holds.
                if (winningSideUpper) setClaimSide(winningSideUpper)
                else if (userTfYes > 0 || userTfNo === 0) setClaimSide('YES')
                else setClaimSide('NO')
              }
            }}
            className="flex-1 px-2 py-3 text-[10px] font-mono tracking-wide transition-colors"
            style={{
              color: activeTab === tab ? '#22C55E' : '#94A3B8',
              borderBottom: activeTab === tab ? '2px solid #22C55E' : '2px solid transparent',
              marginBottom: -1,
              backgroundColor: activeTab === tab ? 'rgba(34,197,94,0.05)' : 'transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Status banner */}
        {notRegistered && (
          <div
            className="text-xs font-mono p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(168,139,250,0.08)', border: '1px solid rgba(168,139,250,0.3)', color: '#A78BFA' }}
          >
            This Kalshi ticker isn’t bonded on Truth.fun yet. Click below to create
            the on-chain market — takes ~3 seconds.
          </div>
        )}
        {status === 'resolved' && !isVoid && (
          <div
            className="text-xs font-mono p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
          >
            Market resolved · {winningSide.toUpperCase()} won. Use the CLAIM tab to redeem your tokens.
          </div>
        )}
        {isVoid && (
          <div
            className="text-xs font-mono p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(168,139,250,0.08)', border: '1px solid rgba(168,139,250,0.3)', color: '#A78BFA' }}
          >
            Market void · resolved as <span className="font-bold">undecided</span>.
            Your tokens stay in your wallet — no claim is possible and nothing is burned.
          </div>
        )}

        {/* Current curve / oracle prices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-xs font-mono">
            <div style={{ color: '#475569' }}>Curve {tabSide(activeTab) ?? 'YES'}</div>
            <div style={{ color: '#22C55E' }} className="text-base">
              {sidePrice !== null ? `$${sidePrice.toFixed(4)}` : '—'}
            </div>
          </div>
          <div className="text-xs font-mono text-right">
            <div style={{ color: '#475569' }}>Kalshi (DFlow)</div>
            <div style={{ color: '#A78BFA' }} className="text-base">
              ${dflowBasePrice.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Your position */}
        {!notRegistered && (
          <YourPosition
            connected={wallet.connected}
            activeTab={activeTab}
            claimSide={claimSide}
            userTfYes={userTfYes}
            userTfNo={userTfNo}
            onMax={(value) => setAmount(value.toString())}
          />
        )}

        {/* CLAIM-tab side selector — only when the market is decided */}
        {!notRegistered && activeTab === 'CLAIM' && !isVoid && winningSideUpper && (
          <div>
            <div className="text-xs font-mono mb-1.5" style={{ color: '#94A3B8' }}>
              Claim side
            </div>
            <div className="flex gap-2">
              {(['YES', 'NO'] as const).map((s) => {
                const isWin = winningSideUpper === s
                const selected = claimSide === s
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setClaimSide(s)
                      setAmount('')
                      setBurnConfirmed(false)
                      setError(null)
                    }}
                    className="flex-1 py-2 rounded-lg text-xs font-mono tracking-wide transition-all"
                    style={{
                      backgroundColor: selected
                        ? isWin
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(239,68,68,0.12)'
                        : '#1A1A26',
                      color: selected ? (isWin ? '#22C55E' : '#EF4444') : '#94A3B8',
                      border: `1px solid ${
                        selected
                          ? isWin
                            ? 'rgba(34,197,94,0.4)'
                            : 'rgba(239,68,68,0.4)'
                          : '#2A2A3A'
                      }`,
                    }}
                  >
                    tf{s} · {isWin ? 'winning' : 'losing'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Loser-burn warning + opt-in checkbox */}
        {activeTab === 'CLAIM' && isClaimingLoser && (
          <div
            className="p-3 rounded-lg space-y-2 text-xs font-mono"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            <div className="font-semibold">
              tf{claimSide} lost — these tokens will burn for $0.
            </div>
            <div style={{ color: '#94A3B8' }}>
              You can also leave them in your wallet; nothing forces you to claim.
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1" style={{ color: '#FFFFFF' }}>
              <input
                type="checkbox"
                checked={burnConfirmed}
                onChange={(e) => setBurnConfirmed(e.target.checked)}
                className="cursor-pointer"
              />
              <span>I understand these tokens have no value and will be burned.</span>
            </label>
          </div>
        )}

        {/* Amount input — hidden on void markets (no claim is possible) */}
        {!notRegistered && !(activeTab === 'CLAIM' && isVoid) && (
          <div>
            <label className="text-xs font-mono mb-1.5 block" style={{ color: '#94A3B8' }}>
              {isBuyTab(activeTab) ? 'USDC amount' : activeTab === 'CLAIM' ? 'Tokens to claim' : 'Tokens in'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg px-4 py-3 font-mono text-white text-lg outline-none focus:ring-1"
                style={
                  {
                    backgroundColor: '#1A1A26',
                    border: '1px solid #2A2A3A',
                    '--tw-ring-color': '#22C55E',
                  } as React.CSSProperties
                }
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono"
                style={{ color: '#475569' }}
              >
                {isBuyTab(activeTab) ? 'USDC' : activeTab === 'CLAIM' ? `tf${claimSide}` : `tf${tabSide(activeTab)}`}
              </span>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && parsedAmount > 0 && (
          <div className="p-3 rounded-lg space-y-1.5" style={{ backgroundColor: '#1A1A26' }}>
            {isBuyTab(activeTab) ? (
              <>
                <Row
                  label="You receive"
                  value={`~${(preview as { tokensOut: number }).tokensOut.toFixed(4)} tf${tabSide(activeTab)}`}
                />
                <Row
                  label="Price after trade"
                  value={`$${(preview as { newPrice: number }).newPrice.toFixed(4)}`}
                  valueColor="#22C55E"
                />
                <Row
                  label="Price impact"
                  value={`${(preview as { priceImpact: number }).priceImpact.toFixed(2)}%`}
                  valueColor={(preview as { priceImpact: number }).priceImpact > 5 ? '#EF4444' : '#94A3B8'}
                />
                <Row label="1% vig → Bonus Pool" value={`+$${(parsedAmount * 0.01).toFixed(4)}`} valueColor="#22C55E" />
              </>
            ) : (
              <>
                <Row
                  label="You receive"
                  value={`~$${(preview as { usdcOut: number }).usdcOut.toFixed(4)} USDC`}
                />
                <Row
                  label="Price after trade"
                  value={`$${(preview as { newPrice: number }).newPrice.toFixed(4)}`}
                  valueColor="#22C55E"
                />
              </>
            )}
          </div>
        )}

        {/* Slippage */}
        {!notRegistered && activeTab !== 'CLAIM' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: '#475569' }}>Slippage</span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className="px-2 py-1 rounded text-xs font-mono transition-colors"
                style={{
                  backgroundColor: slippage === s ? 'rgba(34,197,94,0.2)' : '#1A1A26',
                  color: slippage === s ? '#22C55E' : '#94A3B8',
                  border: `1px solid ${slippage === s ? 'rgba(34,197,94,0.4)' : '#2A2A3A'}`,
                }}
              >
                {s}%
              </button>
            ))}
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <p className="text-xs font-mono break-all" style={{ color: '#EF4444' }}>
            {error}
          </p>
        )}
        {txSig && (
          <div className="text-xs font-mono space-y-1">
            <p style={{ color: '#22C55E' }}>Tx confirmed!</p>
            <code className="block break-all" style={{ color: '#94A3B8' }}>
              {txSig}
            </code>
          </div>
        )}

        {/* Action button — hidden on void markets, no claim is possible */}
        {!(activeTab === 'CLAIM' && isVoid) && (
          <button
            onClick={notRegistered ? handleCreateMarket : handleTrade}
            disabled={notRegistered ? isCreatingMarket : buttonDisabled}
            className="w-full py-3.5 rounded-lg font-mono font-semibold text-sm tracking-wide transition-all"
            style={{
              backgroundColor:
                notRegistered
                  ? isCreatingMarket
                    ? '#1A1A26'
                    : '#A78BFA'
                  : buttonDisabled
                  ? '#1A1A26'
                  : isClaimingLoser
                  ? '#EF4444'
                  : '#22C55E',
              color: notRegistered ? (isCreatingMarket ? '#475569' : '#000') : buttonDisabled ? '#475569' : '#000',
              cursor: (notRegistered ? isCreatingMarket : buttonDisabled) ? 'not-allowed' : 'pointer',
              boxShadow:
                !buttonDisabled && !notRegistered && !isClaimingLoser
                  ? '0 0 20px rgba(34, 197, 94, 0.2)'
                  : 'none',
            }}
          >
            {notRegistered && isCreatingMarket ? 'Creating market…' : buttonLabel()}
          </button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between text-xs font-mono">
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ color: valueColor ?? '#FFFFFF' }}>{value}</span>
    </div>
  )
}

interface YourPositionProps {
  connected: boolean
  activeTab: Tab
  /** When activeTab === 'CLAIM', which side the user is targeting (YES or NO). */
  claimSide: Side
  userTfYes: number
  userTfNo: number
  onMax: (value: number) => void
}

function YourPosition({
  connected,
  activeTab,
  claimSide,
  userTfYes,
  userTfNo,
  onMax,
}: YourPositionProps) {
  const sellSide: 'YES' | 'NO' | null =
    activeTab === 'SELL YES' ? 'YES' : activeTab === 'SELL NO' ? 'NO' : null
  const claimableTokens = claimSide === 'YES' ? userTfYes : userTfNo
  const sellableTokens = sellSide === 'YES' ? userTfYes : sellSide === 'NO' ? userTfNo : 0
  const dim = !connected

  return (
    <div
      className="p-3 rounded-lg flex items-center justify-between"
      style={{ backgroundColor: '#1A1A26', opacity: dim ? 0.5 : 1 }}
    >
      <div className="text-xs font-mono">
        <div style={{ color: '#475569' }}>Your position</div>
        <div style={{ color: '#FFFFFF' }} className="text-sm mt-0.5">
          {connected
            ? `${userTfYes.toFixed(4)} tfYES · ${userTfNo.toFixed(4)} tfNO`
            : 'Connect wallet to view'}
        </div>
      </div>
      {connected && (sellSide || activeTab === 'CLAIM') && (
        <button
          onClick={() =>
            onMax(activeTab === 'CLAIM' ? claimableTokens : sellableTokens)
          }
          disabled={
            (activeTab === 'CLAIM' ? claimableTokens : sellableTokens) <= 0
          }
          className="px-2.5 py-1 rounded text-[10px] font-mono tracking-wide transition-colors"
          style={{
            backgroundColor: 'rgba(34,197,94,0.15)',
            color: '#22C55E',
            border: '1px solid rgba(34,197,94,0.35)',
            cursor:
              (activeTab === 'CLAIM' ? claimableTokens : sellableTokens) <= 0
                ? 'not-allowed'
                : 'pointer',
            opacity:
              (activeTab === 'CLAIM' ? claimableTokens : sellableTokens) <= 0
                ? 0.5
                : 1,
          }}
        >
          MAX
        </button>
      )}
    </div>
  )
}
