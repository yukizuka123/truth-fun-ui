'use client'

import { useBonusPool } from '@/hooks/useBonusPool'
import { calcBonusPool } from '@/lib/math'

interface Props {
  marketId: string
  entryPrice?: number
}

const VOLUME_SCENARIOS = [
  { label: '$10K/day', dailyVol: 10000, sprintMult: 1 / 6 },
  { label: '$50K/day', dailyVol: 50000, sprintMult: 1 / 6 },
  { label: '$100K/day', dailyVol: 100000, sprintMult: 1 / 6 },
  { label: '$500K/day', dailyVol: 500000, sprintMult: 1 / 6 },
  { label: '$1M/day', dailyVol: 1000000, sprintMult: 1 / 6 },
]

export default function BonusPoolTracker({ marketId, entryPrice = 0.6 }: Props) {
  const { balance, bonusPerToken, effectiveReturn, totalVolume, isLoading } = useBonusPool(
    marketId,
    entryPrice
  )

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#111118',
        border: '1px solid rgba(34,197,94,0.2)',
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.05)',
      }}
    >
      <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
        Bonus Pool
      </p>

      <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#22C55E' }}>
        {isLoading ? '—' : `$${balance.toFixed(2)}`}
      </p>

      <div className="flex gap-6 mt-3 mb-5">
        <div>
          <p className="text-xs font-mono" style={{ color: '#475569' }}>
            Per token
          </p>
          <p className="font-mono text-white">${bonusPerToken.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-xs font-mono" style={{ color: '#475569' }}>
            Est. return
          </p>
          <p className="font-mono" style={{ color: '#22C55E' }}>
            {effectiveReturn.toFixed(2)}x
          </p>
        </div>
        <div>
          <p className="text-xs font-mono" style={{ color: '#475569' }}>
            Total volume
          </p>
          <p className="font-mono text-white">${(totalVolume / 1000).toFixed(1)}K</p>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid #2A2A3A' }}
      >
        <div
          className="px-3 py-2"
          style={{ backgroundColor: '#1A1A26' }}
        >
          <p className="text-xs uppercase tracking-widest font-mono" style={{ color: '#475569' }}>
            Volume → Bonus Projection (4-hr sprint)
          </p>
        </div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A3A' }}>
              <th className="text-left px-3 py-2" style={{ color: '#475569' }}>Volume</th>
              <th className="text-right px-3 py-2" style={{ color: '#475569' }}>Bonus Pool</th>
              <th className="text-right px-3 py-2" style={{ color: '#475569' }}>/token</th>
              <th className="text-right px-3 py-2" style={{ color: '#475569' }}>Return</th>
            </tr>
          </thead>
          <tbody>
            {VOLUME_SCENARIOS.map((s) => {
              const sprintVol = s.dailyVol * s.sprintMult
              const pool = calcBonusPool(sprintVol * 0.6, sprintVol * 0.4, 0.08)
              const bpt = pool / 10000
              const ret = (1.0 + bpt) / entryPrice
              return (
                <tr
                  key={s.label}
                  style={{ borderBottom: '1px solid #1A1A26' }}
                >
                  <td className="px-3 py-2" style={{ color: '#94A3B8' }}>{s.label}</td>
                  <td className="px-3 py-2 text-right text-white">${pool.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right" style={{ color: '#22C55E' }}>
                    ${bpt.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: '#22C55E' }}>
                    {ret.toFixed(2)}x
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
