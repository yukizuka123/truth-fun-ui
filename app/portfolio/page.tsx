'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import useSWR from 'swr'
import { getPositions, Position } from '@/lib/dflow'
import PositionRow from '@/components/PositionRow'

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet()
  const { data: positions, isLoading } = useSWR<Position[]>(
    publicKey ? `positions-${publicKey.toBase58()}` : null,
    () => getPositions(publicKey!.toBase58()),
    { refreshInterval: 30000 }
  )

  if (!connected) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-semibold text-white mb-2">Connect your wallet</p>
        <p className="text-sm font-mono" style={{ color: '#94A3B8' }}>
          Connect Phantom or Backpack to view your positions.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-24">
        <p className="font-mono text-sm" style={{ color: '#475569' }}>
          Loading positions…
        </p>
      </div>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Portfolio</h1>
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
        >
          <p className="font-mono text-lg" style={{ color: '#475569' }}>
            No open positions
          </p>
          <p className="text-sm mt-2" style={{ color: '#475569' }}>
            Trade on a market to see your positions here.
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg font-mono text-sm transition-colors"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
          >
            Browse Markets →
          </a>
        </div>
      </div>
    )
  }

  const activeCount = positions.filter((p) => p.status === 'ACTIVE').length
  const claimableCount = positions.filter((p) => p.status === 'CLAIMABLE').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <div className="flex gap-3">
          {activeCount > 0 && (
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
            >
              {activeCount} active
            </div>
          )}
          {claimableCount > 0 && (
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-mono animate-pulse"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}
            >
              {claimableCount} claimable
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A3A', backgroundColor: '#1A1A26' }}>
                {['Market', 'Token', 'Entry', 'Current', 'P&L', 'Status', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest"
                    style={{ color: '#475569' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => (
                <PositionRow key={`${pos.marketId}-${pos.tokenType}-${i}`} position={pos} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
