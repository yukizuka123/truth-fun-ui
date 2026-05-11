'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/lib/queries'
import type { DFlowEvent } from '@/lib/dflow/types'

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data, isFetching } = useSearch(query)
  const results: DFlowEvent[] = data?.events ?? []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (ticker: string) => {
    setQuery('')
    setOpen(false)
    router.push(`/markets/${encodeURIComponent(ticker)}`)
  }

  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mb-6">
      <div className="flex items-center sketch-border border-2 border-border rounded-xl bg-bg-card overflow-hidden focus-within:border-accent-blue transition-colors">
        <span className="pl-4 text-ink-muted text-base select-none">🔍</span>
        <input
          type="text"
          value={query}
          placeholder="Search markets…"
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 px-3 py-3 bg-transparent font-mono text-sm text-ink placeholder-ink-muted focus:outline-none"
        />
        {isFetching && (
          <div className="flex gap-0.5 pr-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}
        {query && !isFetching && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="pr-3 text-ink-muted hover:text-ink transition-colors font-mono text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 sketch-border border-2 border-border rounded-xl bg-bg-card shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {results.length === 0 && !isFetching && (
            <div className="px-4 py-6 text-center font-mono text-xs text-ink-muted">
              No markets found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((event) => (
            <button
              key={event.ticker}
              onClick={() => handleSelect(event.markets?.[0]?.ticker ?? event.ticker)}
              className="w-full text-left px-4 py-3 hover:bg-bg-secondary transition-colors border-b border-dashed border-border last:border-b-0"
            >
              <div className="font-display font-bold text-sm text-ink line-clamp-1">{event.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-ink-muted">{event.ticker}</span>
                <span className="font-mono text-xs text-accent-blue">
                  {event.markets?.[0]
                    ? `${(parseFloat(event.markets[0].yesAsk ?? event.markets[0].yesBid ?? '0.5') * 100).toFixed(0)}¢`
                    : null}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
