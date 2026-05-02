'use client'

import Link from 'next/link'
import { Position } from '@/lib/dflow'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22C55E',
  RESOLVING: '#FACC15',
  CLAIMABLE: '#A78BFA',
}

interface Props {
  position: Position
}

export default function PositionRow({ position: pos }: Props) {
  const pnlPct = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100
  const pnlPositive = pnlPct >= 0

  return (
    <tr style={{ borderBottom: '1px solid #1A1A26' }}>
      <td className="px-4 py-3 max-w-xs">
        <Link
          href={`/market/${pos.marketId}`}
          className="text-sm text-white hover:text-green-400 transition-colors font-medium block truncate"
        >
          {pos.question}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            color: pos.tokenType === 'YES' ? '#22C55E' : '#A78BFA',
            backgroundColor: pos.tokenType === 'YES' ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)',
          }}
        >
          {pos.tokenType}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-sm" style={{ color: '#94A3B8' }}>
        ${pos.entryPrice.toFixed(4)}
      </td>
      <td className="px-4 py-3 font-mono text-sm" style={{ color: '#22C55E' }}>
        ${pos.currentPrice.toFixed(4)}
      </td>
      <td className="px-4 py-3 font-mono text-sm font-semibold">
        <span style={{ color: pnlPositive ? '#22C55E' : '#EF4444' }}>
          {pnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            color: STATUS_COLORS[pos.status] ?? '#94A3B8',
            backgroundColor: `${STATUS_COLORS[pos.status] ?? '#94A3B8'}18`,
          }}
        >
          {pos.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/market/${pos.marketId}`}
          className="text-xs font-mono px-3 py-1.5 rounded transition-colors"
          style={{
            color: pos.status === 'CLAIMABLE' ? '#000' : '#22C55E',
            backgroundColor: pos.status === 'CLAIMABLE' ? '#22C55E' : 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
          }}
        >
          {pos.status === 'CLAIMABLE' ? 'Claim →' : pos.status === 'ACTIVE' ? 'Trade →' : 'View →'}
        </Link>
      </td>
    </tr>
  )
}
