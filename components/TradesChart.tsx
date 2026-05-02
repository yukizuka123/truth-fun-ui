'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTrades } from '@/hooks/dflow/useTrades'

interface Props {
  marketTicker: string
}

export function TradesChart({ marketTicker }: Props) {
  const { data: trades, isLoading } = useTrades(marketTicker)

  if (isLoading) {
    return (
      <div className="h-52 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!trades?.length) {
    return (
      <div className="h-52 flex items-center justify-center text-ink-muted font-ui text-sm">
        No trade history yet
      </div>
    )
  }

  const chartData = [...trades]
    .sort((a, b) => a.createdTime - b.createdTime)
    .slice(-60)
    .map((t) => ({
      time: new Date(t.createdTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      yes: +(t.yesPrice * 100).toFixed(1),
      no: +(t.noPrice * 100).toFixed(1),
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}¢`}
          tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
          width={36}
        />
        <Tooltip
          formatter={(v, name) => [`${Number(v ?? 0).toFixed(1)}¢`, name === 'yes' ? 'YES' : 'NO']}
          contentStyle={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="yes"
          name="yes"
          stroke="var(--accent-green)"
          fill="var(--accent-green)"
          fillOpacity={0.1}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="no"
          name="no"
          stroke="var(--accent-red)"
          fill="var(--accent-red)"
          fillOpacity={0.1}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
