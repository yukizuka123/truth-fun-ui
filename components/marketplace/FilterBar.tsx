'use client'

import type { MarketSort, MarketStatus } from '@/hooks/dflow/useMarketplace'
import { useFilters } from '@/lib/queries'

const SORT_OPTIONS: { value: MarketSort; label: string }[] = [
  { value: 'volume24h', label: '24h Volume' },
  { value: 'volume', label: 'Total Volume' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'openInterest', label: 'Open Interest' },
  { value: 'startDate', label: 'Newest First' },
]

const STATUS_OPTIONS: { value: MarketStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Resolved' },
  { value: 'all', label: 'All' },
]

interface FilterBarProps {
  sort: MarketSort
  status: MarketStatus
  category?: string
  onSortChange: (v: MarketSort) => void
  onStatusChange: (v: MarketStatus) => void
  onCategoryChange: (v: string | undefined) => void
  totalCount?: number
}

export function FilterBar({
  sort,
  status,
  category,
  onSortChange,
  onStatusChange,
  onCategoryChange,
  totalCount,
}: FilterBarProps) {
  const { data: filtersData } = useFilters()
  const categories: string[] = filtersData ? Object.keys(filtersData) : []

  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`px-3 py-1.5 font-mono text-xs font-bold rounded-full border-2 transition-colors duration-150 ${
              !category
                ? 'bg-ink text-bg border-ink'
                : 'bg-bg-card text-ink-light border-border hover:border-ink-muted hover:text-ink'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === category ? undefined : cat)}
              className={`px-3 py-1.5 font-mono text-xs font-bold rounded-full border-2 transition-colors duration-150 ${
                category === cat
                  ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/60'
                  : 'bg-bg-card text-ink-light border-border hover:border-accent-blue/40 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Status + sort row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Status toggle */}
      <div className="flex sketch-border border-2 border-border rounded-xl overflow-hidden">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStatusChange(value)}
            className={`px-4 py-2 font-mono text-sm font-bold transition-colors duration-150 ${
              status === value
                ? 'bg-ink text-bg'
                : 'bg-bg-card text-ink-light hover:text-ink hover:bg-bg-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count + sort */}
      <div className="flex items-center gap-3">
        {totalCount !== undefined && (
          <span className="font-mono text-xs text-ink-muted tabular-nums">
            {totalCount.toLocaleString()} markets
          </span>
        )}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as MarketSort)}
          className="sketch-border border-2 border-border rounded-xl px-3 py-2 bg-bg-card text-ink font-mono text-sm focus:outline-none focus:border-accent-blue cursor-pointer appearance-none pr-7"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      </div>
    </div>
  )
}
