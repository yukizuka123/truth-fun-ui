'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { useCurveState } from '@/hooks/useCurveState'
import { useLivePrice } from '@/hooks/useLivePrice'

interface DataPoint {
  time: string
  curvePrice: number
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
  const { curvePrice } = useCurveState(marketId)
  const liveBase = useLivePrice(marketId)
  const [history, setHistory] = useState<DataPoint[]>([])

  useEffect(() => {
    const now = new Date()
    const label = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    const cp = curvePrice ?? dflowBasePrice
    const db = liveBase ?? dflowBasePrice

    setHistory((prev) => {
      const next = [...prev, { time: label, curvePrice: cp, dflowBase: db }]
      return next.slice(-60)
    })
  }, [curvePrice, liveBase, dflowBasePrice])

  const spread = (curvePrice ?? dflowBasePrice) - (liveBase ?? dflowBasePrice)

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
              Curve Price
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#22C55E' }}>
              ${(curvePrice ?? dflowBasePrice).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-mono mb-1" style={{ color: '#94A3B8' }}>
              DFlow Base
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: '#A78BFA' }}>
              ${(liveBase ?? dflowBasePrice).toFixed(4)}
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
          {spread >= 0 ? '+' : ''}${spread.toFixed(4)} vs DFlow base
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#22C55E' }} />
          <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>truth.fun curve</span>
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
            domain={['auto', 'auto']}
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="curvePrice"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            name="Curve Price"
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
