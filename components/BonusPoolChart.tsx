'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { useBonusPool } from '@/hooks/useBonusPool'

interface DataPoint {
  time: string
  pool: number
  annotation?: string
}

interface Props {
  marketId: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 text-xs font-mono"
      style={{ backgroundColor: '#1A1A26', border: '1px solid #2A2A3A' }}
    >
      <p style={{ color: '#94A3B8' }}>{label}</p>
      <p style={{ color: '#22C55E' }}>Pool: ${Number(payload[0]?.value).toFixed(2)}</p>
      {payload[0]?.payload?.annotation && (
        <p style={{ color: '#FACC15' }}>{payload[0].payload.annotation}</p>
      )}
    </div>
  )
}

export default function BonusPoolChart({ marketId }: Props) {
  const { balance } = useBonusPool(marketId)
  const [history, setHistory] = useState<DataPoint[]>([])

  // Sample on a fixed timer (mirrors PriceChart) so the chart accumulates
  // points during flat periods. Keying off `balance` alone produced gaps
  // whenever the pool was steady.
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const label = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      setHistory((prev) => {
        const next = [...prev, { time: label, pool: balance }]
        return next.slice(-120)
      })
    }
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [balance])

  if (history.length < 2) {
    return (
      <div
        className="rounded-xl p-5 flex items-center justify-center"
        style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', height: 180 }}
      >
        <p className="text-xs font-mono" style={{ color: '#475569' }}>
          Collecting bonus pool data…
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
    >
      <p className="text-xs uppercase tracking-widest font-mono mb-4" style={{ color: '#94A3B8' }}>
        Bonus Pool Growth
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="poolGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pool"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#poolGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
