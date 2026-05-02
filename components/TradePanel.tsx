'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCurveState } from '@/hooks/useCurveState'
import { buyQuote, sellQuote } from '@/lib/math'
import { buyCurve, sellCurve, redeemFromReserve, getRedemptionReserveState } from '@/lib/anchor'
import useSWR from 'swr'

type Tab = 'BUY YES' | 'BUY NO' | 'SELL' | 'REDEEM'

const TABS: Tab[] = ['BUY YES', 'BUY NO', 'SELL', 'REDEEM']

interface Props {
  marketId: string
  dflowBasePrice: number
}

export default function TradePanel({ marketId, dflowBasePrice }: Props) {
  const { connected } = useWallet()
  const { curveState, curvePrice, refresh } = useCurveState(marketId)
  const { data: reserve } = useSWR(`reserve-${marketId}`, () => getRedemptionReserveState(marketId), {
    refreshInterval: 15000,
  })

  const [activeTab, setActiveTab] = useState<Tab>('BUY YES')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [txSig, setTxSig] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = parseFloat(amount) || 0

  const preview = (() => {
    if (!curveState || parsedAmount <= 0) return null
    if (activeTab === 'BUY YES' || activeTab === 'BUY NO') {
      return buyQuote(curveState, parsedAmount)
    }
    if (activeTab === 'SELL') {
      return sellQuote(curveState, parsedAmount)
    }
    if (activeTab === 'REDEEM' && reserve) {
      const usdcOut = parsedAmount * reserve.twapPrice * (1 - 0.005)
      return { usdcOut, twapPrice: reserve.twapPrice }
    }
    return null
  })()

  const handleTrade = async () => {
    if (!connected || !parsedAmount) return
    setIsLoading(true)
    setError(null)
    setTxSig(null)

    try {
      let sig: string
      if (activeTab === 'BUY YES' || activeTab === 'BUY NO') {
        const minOut = preview ? (preview as any).tokensOut * (1 - slippage / 100) : 0
        sig = await buyCurve({ marketId, usdcIn: parsedAmount, minTokensOut: minOut })
      } else if (activeTab === 'SELL') {
        const minOut = preview ? (preview as any).usdcOut * (1 - slippage / 100) : 0
        sig = await sellCurve({ marketId, tokensIn: parsedAmount, minUsdcOut: minOut })
      } else {
        const minOut = preview ? (preview as any).usdcOut * (1 - slippage / 100) : 0
        sig = await redeemFromReserve({ marketId, tokensIn: parsedAmount, minUsdcOut: minOut })
      }
      setTxSig(sig)
      setAmount('')
      refresh()
    } catch (e: any) {
      setError(e.message ?? 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonLabel = () => {
    if (!connected) return 'Connect Wallet to Trade'
    if (isLoading) return 'Confirming…'
    if (activeTab === 'REDEEM') return 'Redeem via Reserve →'
    return `${activeTab} →`
  }

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
            onClick={() => { setActiveTab(tab); setError(null); setTxSig(null) }}
            className="flex-1 px-2 py-3 text-xs font-mono tracking-wide transition-colors"
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
        {/* Current price */}
        <div className="flex justify-between text-xs font-mono">
          <span style={{ color: '#475569' }}>Current curve price</span>
          <span style={{ color: '#22C55E' }}>
            {curvePrice !== null ? `$${curvePrice.toFixed(4)}` : '—'}
          </span>
        </div>

        {/* REDEEM: Reserve info */}
        {activeTab === 'REDEEM' && reserve && (
          <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A26' }}>
            {reserve.oracleStale ? (
              <p className="text-xs font-mono text-red-400">
                ⚠ Oracle stale. Redemptions paused.
              </p>
            ) : (
              <>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>TWAP oracle price</span>
                  <span style={{ color: '#A78BFA' }}>${reserve.twapPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Reserve balance</span>
                  <span className="text-white">${reserve.reserveBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Hourly cap used</span>
                  <span style={{ color: reserve.hourlyUsedPct > 80 ? '#EF4444' : '#22C55E' }}>
                    {reserve.hourlyUsedPct.toFixed(1)}% of 5%
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Redemption fee</span>
                  <span style={{ color: '#94A3B8' }}>0.5% → Bonus Pool</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Amount input */}
        <div>
          <label className="text-xs font-mono mb-1.5 block" style={{ color: '#94A3B8' }}>
            {activeTab === 'SELL' || activeTab === 'REDEEM' ? 'Tokens in' : 'USDC amount'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg px-4 py-3 font-mono text-white text-lg outline-none focus:ring-1"
              style={{
                backgroundColor: '#1A1A26',
                border: '1px solid #2A2A3A',
                '--tw-ring-color': '#22C55E',
              } as any}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono"
              style={{ color: '#475569' }}
            >
              {activeTab === 'SELL' || activeTab === 'REDEEM' ? 'tokens' : 'USDC'}
            </span>
          </div>
        </div>

        {/* Preview */}
        {preview && parsedAmount > 0 && (
          <div className="p-3 rounded-lg space-y-1.5" style={{ backgroundColor: '#1A1A26' }}>
            {activeTab === 'BUY YES' || activeTab === 'BUY NO' ? (
              <>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>You receive</span>
                  <span className="text-white">
                    ~{((preview as any).tokensOut ?? 0).toFixed(4)} tf
                    {activeTab === 'BUY YES' ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Price after trade</span>
                  <span style={{ color: '#22C55E' }}>
                    ${((preview as any).newPrice ?? 0).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Price impact</span>
                  <span
                    style={{
                      color: (preview as any).priceImpact > 5 ? '#EF4444' : '#94A3B8',
                    }}
                  >
                    {((preview as any).priceImpact ?? 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>1% vig → Bonus Pool</span>
                  <span style={{ color: '#22C55E' }}>+${(parsedAmount * 0.01).toFixed(4)}</span>
                </div>
              </>
            ) : activeTab === 'SELL' ? (
              <>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>You receive</span>
                  <span className="text-white">
                    ~${((preview as any).usdcOut ?? 0).toFixed(4)} USDC
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>Price after trade</span>
                  <span style={{ color: '#22C55E' }}>
                    ${((preview as any).newPrice ?? 0).toFixed(4)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>You receive</span>
                  <span className="text-white">
                    ~${((preview as any).usdcOut ?? 0).toFixed(4)} USDC
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: '#475569' }}>At TWAP price</span>
                  <span style={{ color: '#A78BFA' }}>
                    ${((preview as any).twapPrice ?? 0).toFixed(4)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Slippage */}
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

        {/* Error / Success */}
        {error && (
          <p className="text-xs font-mono text-red-400 break-all">{error}</p>
        )}
        {txSig && (
          <div className="text-xs font-mono space-y-1">
            <p style={{ color: '#22C55E' }}>Trade confirmed!</p>
            <a
              href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="underline"
              style={{ color: '#22C55E' }}
            >
              View on Explorer ↗
            </a>
          </div>
        )}

        {/* Trade button */}
        <button
          onClick={handleTrade}
          disabled={isLoading || !connected || !parsedAmount}
          className="w-full py-3.5 rounded-lg font-mono font-semibold text-sm tracking-wide transition-all"
          style={{
            backgroundColor: isLoading || !connected || !parsedAmount ? '#1A1A26' : '#22C55E',
            color: isLoading || !connected || !parsedAmount ? '#475569' : '#000',
            cursor: isLoading || !connected || !parsedAmount ? 'not-allowed' : 'pointer',
            boxShadow:
              !isLoading && connected && parsedAmount ? '0 0 20px rgba(34, 197, 94, 0.2)' : 'none',
          }}
        >
          {buttonLabel()}
        </button>
      </div>
    </div>
  )
}
