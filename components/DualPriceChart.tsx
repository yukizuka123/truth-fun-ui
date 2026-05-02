'use client'

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useLivePrice } from '@/hooks/useLivePrice'
import { useCurveState } from '@/hooks/useCurveState'
import { useRef, useState, useEffect } from 'react'

interface ChartPoint {
  time: number
  timeLabel: string
  dflowPrice: number | null
  curvePrice: number | null
}

export function DualPriceChart({ marketTicker }: { marketTicker: string }) {
  const pointsRef = useRef<ChartPoint[]>([])
  const [points, setPoints] = useState<ChartPoint[]>([])
  const livePrice = useLivePrice(marketTicker)
  const curveState = useCurveState(marketTicker)

  const curvePrice = curveState?.curvePrice ?? null

  // Append DFlow price point when live price updates
  useEffect(() => {
    if (livePrice == null) return
    const newPoint: ChartPoint = {
      time: Date.now(),
      timeLabel: new Date().toLocaleTimeString(),
      dflowPrice: livePrice,
      curvePrice: null,
    }
    pointsRef.current = [...pointsRef.current, newPoint].slice(-200)
    setPoints([...pointsRef.current])
  }, [livePrice])

  // Append curve price point when on-chain state updates
  useEffect(() => {
    if (curvePrice == null) return
    const newPoint: ChartPoint = {
      time: Date.now(),
      timeLabel: new Date().toLocaleTimeString(),
      dflowPrice: null,
      curvePrice,
    }
    pointsRef.current = [...pointsRef.current, newPoint].slice(-200)
    setPoints([...pointsRef.current])
  }, [curvePrice])

  return (
    <div className="w-full border-2 border-dashed border-black p-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: any) =>
                value !== null ? `$${Number(value).toFixed(4)}` : 'N/A'
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="dflowPrice"
              name="Kalshi/DFlow"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="curvePrice"
              name="Truth.fun Curve"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {livePrice && curvePrice && (
        <div className="mt-2 font-mono text-xs">
          Arb spread:{' '}
          <span className={curvePrice > livePrice ? 'text-green-600' : 'text-red-600'}>
            ${Math.abs(curvePrice - livePrice).toFixed(4)}
          </span>
        </div>
      )}
    </div>
  )
}
