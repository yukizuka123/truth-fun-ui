'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FilterBar } from '@/components/marketplace/FilterBar'
import { MarketCard, MarketCardSkeleton } from '@/components/marketplace/MarketCard'
import { SearchBox } from '@/components/marketplace/SearchBox'
import { useMarkets } from '@/lib/queries'
import type { MarketSort, MarketStatus } from '@/hooks/dflow/useMarketplace'
import type { DFlowEvent } from '@/lib/dflow/types'

const SKELETON_COUNT = 12

export default function MarketsPage() {
  const [sort, setSort] = useState<MarketSort>('volume24h')
  const [status, setStatus] = useState<MarketStatus>('active')
  const [category, setCategory] = useState<string | undefined>(undefined)

  const filters = useMemo(() => ({ sort, status, ...(category ? { category } : {}) }), [sort, status, category])

  const {
    data: pagesData,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useMarkets(filters)

  const allEvents: DFlowEvent[] = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => pagesData?.pages.flatMap((p: any) => p.items as DFlowEvent[]) ?? [],
    [pagesData],
  )

  const isLoading = isFetching && !pagesData

  return (
    <>
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-10"
          >
            <h1 className="font-display font-black text-5xl md:text-6xl text-ink mb-3">
              Markets
            </h1>
            <p className="font-body text-lg text-ink-light">
              Trade on outcomes. Powered by DFlow prediction markets.
            </p>
          </motion.div>

          {/* Search */}
          <SearchBox />

          {/* Filters */}
          <FilterBar
            sort={sort}
            status={status}
            category={category}
            onSortChange={setSort}
            onStatusChange={setStatus}
            onCategoryChange={setCategory}
            totalCount={isLoading ? undefined : allEvents.length}
          />

          {/* Error */}
          {isError && (
            <div className="text-center py-20 font-mono text-ink-muted">
              Failed to load markets. Please try again.
            </div>
          )}

          {/* Grid */}
          {!isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <MarketCardSkeleton key={i} />
                  ))
                : allEvents.map((event, i) => (
                    <MarketCard key={event.ticker} event={event} index={i} />
                  ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && allEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-24"
            >
              <div className="text-6xl mb-5">📭</div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">No markets found</h3>
              <p className="font-body text-ink-muted">Try adjusting your filters</p>
            </motion.div>
          )}

          {/* Load more */}
          {hasNextPage && !isLoading && (
            <div className="mt-14 text-center">
              <motion.button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="sketch-border font-display font-bold text-base px-10 py-3.5 rounded-xl border-4 border-ink bg-bg text-ink hover:bg-ink hover:text-bg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load More Markets'}
              </motion.button>
            </div>
          )}

          {/* End of results */}
          {!hasNextPage && allEvents.length > 0 && !isFetching && (
            <p className="text-center mt-12 font-mono text-xs text-ink-muted">
              — all {allEvents.length} markets loaded —
            </p>
          )}

        </div>
      </main>
    </>
  )
}
