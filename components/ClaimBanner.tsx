'use client'

import { useState } from 'react'
import { claimPayout } from '@/lib/anchor'
import { useBonusPool } from '@/hooks/useBonusPool'

interface Props {
  marketId: string
  resolution: 'YES' | 'NO'
  tokenCount: number
  entryPrice: number
}

export default function ClaimBanner({ marketId, resolution, tokenCount, entryPrice }: Props) {
  const { bonusPerToken, balance } = useBonusPool(marketId, entryPrice)
  const [isLoading, setIsLoading] = useState(false)
  const [txSig, setTxSig] = useState<string | null>(null)

  const totalPayout = (1.0 + bonusPerToken) * tokenCount
  const effectiveRet = (1.0 + bonusPerToken) / entryPrice

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const sig = await claimPayout(marketId)
      setTxSig(sig)
    } finally {
      setIsLoading(false)
    }
  }

  if (txSig) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
      >
        <p className="font-mono font-semibold" style={{ color: '#22C55E' }}>
          ✓ Payout claimed: ${totalPayout.toFixed(4)} USDC
        </p>
        <a
          href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono underline mt-1 block"
          style={{ color: '#22C55E' }}
        >
          View on Explorer ↗
        </a>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.4)',
        boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)',
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#22C55E' }}>
            Market Resolved · {resolution} Wins
          </p>
          <p className="text-white font-semibold text-lg">
            Claim your payout
          </p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-xs font-mono" style={{ color: '#475569' }}>Base payout</p>
              <p className="font-mono text-white">$1.00 × {tokenCount}</p>
            </div>
            <div>
              <p className="text-xs font-mono" style={{ color: '#475569' }}>Bonus per token</p>
              <p className="font-mono" style={{ color: '#22C55E' }}>+${bonusPerToken.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs font-mono" style={{ color: '#475569' }}>Total payout</p>
              <p className="font-mono font-bold text-lg" style={{ color: '#22C55E' }}>
                ${totalPayout.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono" style={{ color: '#475569' }}>Effective return</p>
              <p className="font-mono font-bold" style={{ color: '#22C55E' }}>
                {effectiveRet.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleClaim}
          disabled={isLoading}
          className="shrink-0 px-6 py-3 rounded-lg font-mono font-semibold text-sm transition-all"
          style={{
            backgroundColor: isLoading ? '#1A1A26' : '#22C55E',
            color: isLoading ? '#475569' : '#000',
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? 'Processing…' : 'Claim Payout →'}
        </button>
      </div>
    </div>
  )
}
