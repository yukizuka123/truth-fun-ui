'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useCurveState } from '@/hooks/useCurveState'
import { useLivePrice } from '@/hooks/useLivePrice'

interface DataPoint {
  time: string
  yesPrice: number
  noPrice: number
  dflowBase: number
}

interface Props {
  marketId: string
  dflowBasePrice: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 text-xs font-mono"
      style={{ backgroundColor: '#1A1A26', border: '1px solid #2A2A3A' }}
    >
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex gap-3 items-center">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#94A3B8' }}>{entry.name}:</span>
          <span style={{ color: entry.color }}>${Number(entry.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PriceChart({ marketId, dflowBasePrice }: Props) {
  const { yesPrice, noPrice } = useCurveState(marketId)
  const liveBase = useLivePrice(marketId)
  const [history, setHistory] = useState<DataPoint[]>([])

  // Sample on a fixed timer (not on dependency change) so the chart accumulates
  // points during flat periods too. Without this, prolonged flat stretches
  // produce zero datapoints and the chart looks "dead" until the next change.
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const label = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      const yp = yesPrice ?? dflowBasePrice
      const np = noPrice ?? Math.max(0, 1 - dflowBasePrice)
      const db = liveBase ?? dflowBasePrice
      setHistory((prev) => {
        const next = [...prev, { time: label, yesPrice: yp, noPrice: np, dflowBase: db }]
        return next.slice(-120) // ~6 min at 3s sampling
      })
    }
    tick() // emit immediately so axes initialize
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [yesPrice, noPrice, liveBase, dflowBasePrice])

  const yesDisplay = yesPrice ?? dflowBasePrice
  const noDisplay = noPrice ?? Math.max(0, 1 - dflowBasePrice)
  const baseDisplay = liveBase ?? dflowBasePrice
  const spread = yesDisplay - baseDisplay

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
              YES Curve
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#22C55E' }}>
              ${yesDisplay.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
              NO Curve
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#F59E0B' }}>
              ${noDisplay.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
              DFlow Base
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#A78BFA' }}>
              ${baseDisplay.toFixed(4)}
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-mono"
          style={{
            backgroundColor: spread >= 0 ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)',
            color: spread >= 0 ? '#FACC15' : '#EF4444',
            border: `1px solid ${spread >= 0 ? 'rgba(250,204,21,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {spread >= 0 ? '+' : ''}${spread.toFixed(4)} YES vs DFlow base
        </div>
      </div>

      <div className="flex gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#22C55E' }} />
          <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>YES curve</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>NO curve</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#8B5CF6' }} />
          <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>DFlow base</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[
              (dataMin: number) => Math.max(0, Math.floor((dataMin - 0.02) * 100) / 100),
              (dataMax: number) => Math.min(1, Math.ceil((dataMax + 0.02) * 100) / 100),
            ]}
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="yesPrice"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            name="YES Curve"
          />
          <Line
            type="monotone"
            dataKey="noPrice"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
            name="NO Curve"
          />
          <Line
            type="monotone"
            dataKey="dflowBase"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
            name="DFlow Base"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
