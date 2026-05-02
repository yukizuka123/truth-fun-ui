# Build Tasks — DFlow Binary Markets

> Read `context.md` first. Then work through these tasks in order.
> Each task is independently testable. Don't skip ahead — later tasks assume earlier ones work.

---

## Phase 0 — Project bootstrap

If a Next.js project doesn't exist yet:

```bash
npx create-next-app@latest dflow-binary --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*"
cd dflow-binary
npm install @tanstack/react-query @tanstack/react-query-devtools recharts
npm install -D @types/node
```

Create `.env.local`:
```bash
DFLOW_ENV=dev
DFLOW_DEV_BASE=https://dev-prediction-markets-api.dflow.net
DFLOW_PROD_BASE=https://prediction-markets-api.dflow.net
DFLOW_API_KEY=
```

Create `.env.example` with the same keys, all empty. Add `.env.local` to `.gitignore` (it's there by default in Next.js).

**Done when:** `npm run dev` starts the server on `:3000` without errors.

---

## Phase 1 — Foundation (lib layer)

These three files are imported by everything else. Build them first, fully, before touching any route.

### Task 1.1 — `lib/dflow.ts` (the proxy core)

Read `context.md` § "Why we have a backend" and `docs/api/README.md` first.

Create `lib/dflow.ts`:

```ts
const isProd = process.env.DFLOW_ENV === 'prod';

const BASE = isProd
  ? process.env.DFLOW_PROD_BASE!
  : process.env.DFLOW_DEV_BASE ?? 'https://dev-prediction-markets-api.dflow.net';

const API_KEY = isProd ? process.env.DFLOW_API_KEY : undefined;

if (isProd && !API_KEY) {
  throw new Error('DFLOW_ENV=prod requires DFLOW_API_KEY to be set');
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export class DFlowError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'DFlowError';
  }
}

export async function dflow<T>(path: string, params?: QueryParams): Promise<T> {
  const url = new URL(`/api/v1${path}`, BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new DFlowError(res.status, `DFlow ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/** Wrap a route handler so DFlowError becomes a clean JSON response. */
export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return Response.json(data);
  } catch (err) {
    if (err instanceof DFlowError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
```

**Done when:** `lib/dflow.ts` compiles. (No runtime test possible yet — needs a route.)

### Task 1.2 — `lib/binary.ts` (types + binary filter)

```ts
export interface MarketAccount {
  marketLedger: string;
  yesMint: string;
  noMint: string;
  isInitialized: boolean;
  redemptionStatus: string | null;
}

export interface DFlowMarket {
  ticker: string;
  eventTicker: string;
  title: string;
  subtitle?: string | null;
  yesSubTitle?: string;
  noSubTitle?: string;
  status: string;
  result?: string;
  openTime: number;
  closeTime: number;
  expirationTime: number;
  volume?: number | null;
  openInterest?: number | null;
  yesBid?: string | null;
  yesAsk?: string | null;
  noBid?: string | null;
  noAsk?: string | null;
  accounts?: Record<string, MarketAccount>;
  rulesPrimary?: string;
  rulesSecondary?: string | null;
  [k: string]: unknown;
}

export interface DFlowEvent {
  ticker: string;
  seriesTicker?: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  liquidity?: number | null;
  openInterest?: number | null;
  volume?: number | null;
  volume24h?: number | null;
  strikeDate?: number | null;
  strikePeriod?: string | null;
  category?: string;
  markets?: DFlowMarket[];
  createdAt?: number;
  [k: string]: unknown;
}

/**
 * A binary event has exactly one market with a YES/NO question.
 * Multi-outcome events (e.g. "Who wins?") have multiple markets.
 * DFlow has no `binary=true` filter — we identify by structure.
 */
export const isBinaryEvent = (e: DFlowEvent): boolean =>
  Array.isArray(e.markets) && e.markets.length === 1;

/** Get the single market from a known-binary event. */
export const binaryMarket = (e: DFlowEvent): DFlowMarket | null =>
  isBinaryEvent(e) ? e.markets![0] : null;
```

### Task 1.3 — `lib/format.ts` (display helpers)

```ts
/** "0.6100" string or 6100 int → 0.61 number, or null. */
export function priceToFloat(p: string | number | null | undefined): number | null {
  if (p == null) return null;
  if (typeof p === 'string') {
    const n = parseFloat(p);
    return Number.isFinite(n) ? n : null;
  }
  // Integer 0–10000 scale
  if (p > 1) return p / 10000;
  return p;
}

/** 0.61 → "61%" */
export function pct(p: number | null | undefined): string {
  if (p == null) return '—';
  return `${Math.round(p * 100)}%`;
}

/** 0.61 → "61¢" */
export function cents(p: number | null | undefined): string {
  if (p == null) return '—';
  return `${Math.round(p * 100)}¢`;
}

/** 1234567 → "$1.23M" */
export function shortMoney(n: number | null | undefined): string {
  if (n == null || n === 0) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** Unix seconds → "Closes in 3d" or "Closed". null → "—". */
export function closesIn(unixSec: number | null | undefined): string {
  if (!unixSec) return '—';
  const ms = unixSec * 1000 - Date.now();
  if (ms < 0) return 'Closed';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `Closes in ${days}d`;
  if (hours > 0) return `Closes in ${hours}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `Closes in ${mins}m`;
}
```

**Done when:** All three files compile. Run `npx tsc --noEmit` from project root.

---

## Phase 2 — Proxy routes

Build in this order. After each route, manually `curl localhost:3000/api/<route>` to verify it returns valid JSON before moving on.

### Task 2.1 — `app/api/dashboard/route.ts`

Reference: `docs/api/events.md`.

```ts
import { dflow, handle } from '@/lib/dflow';
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary';

export async function GET() {
  return handle(async () => {
    const { events } = await dflow<{ events: DFlowEvent[] }>('/events', {
      withNestedMarkets: true,
      status: 'active',
      limit: 100,
    });

    const binary = events.filter(isBinaryEvent);

    // Top 5 by 24h volume (events without volume sort last)
    const topActive = [...binary]
      .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
      .slice(0, 5);

    // 5 newest by createdAt
    const recent = [...binary]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5);

    return { topActive, recent };
  });
}
```

**Manual test:**
```bash
curl http://localhost:3000/api/dashboard | jq '.topActive | length, .recent | length'
# Should print 5 and 5 (or fewer if dev API has thin data)
```

### Task 2.2 — `app/api/markets/route.ts`

Reference: `docs/api/events.md` § "Pagination and overfetch".

```ts
import { dflow, handle } from '@/lib/dflow';
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary';

const PAGE_SIZE = 20;
const OVERFETCH = 3;

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const cursor = Number(searchParams.get('cursor') ?? 0);
    const status = searchParams.get('status') ?? 'active';
    const category = searchParams.get('category') ?? undefined;
    const seriesTickers = searchParams.get('seriesTickers') ?? undefined;

    const { events } = await dflow<{ events: DFlowEvent[] }>('/events', {
      withNestedMarkets: true,
      status,
      limit: PAGE_SIZE * OVERFETCH,
      offset: cursor,
      category,
      seriesTickers,
    });

    const binary = events.filter(isBinaryEvent).slice(0, PAGE_SIZE);
    const upstreamWasFull = events.length === PAGE_SIZE * OVERFETCH;

    return {
      items: binary,
      nextCursor: upstreamWasFull ? cursor + PAGE_SIZE * OVERFETCH : null,
    };
  });
}
```

**Manual test:**
```bash
curl 'http://localhost:3000/api/markets?status=active' | jq '.items | length, .nextCursor'
curl 'http://localhost:3000/api/markets?status=active&category=Crypto' | jq '.items[0]'
```

### Task 2.3 — `app/api/markets/[ticker]/route.ts`

```ts
import { dflow, handle } from '@/lib/dflow';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  return handle(() => dflow(`/market/${encodeURIComponent(ticker)}`));
}
```

**Manual test:**
```bash
# Pick a ticker from the markets list response
curl http://localhost:3000/api/markets/SOMETICKER | jq '.market.ticker, .market.yesBid'
```

### Task 2.4 — `app/api/markets/[ticker]/candles/route.ts`

Reference: `docs/api/candlesticks.md` § "5000 cap".

```ts
import { dflow, handle } from '@/lib/dflow';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(req.url);

  const now = Math.floor(Date.now() / 1000);
  const startTs = Number(searchParams.get('startTs') ?? now - 24 * 3600);
  const endTs = Number(searchParams.get('endTs') ?? now);
  const periodInterval = searchParams.get('periodInterval') ?? '60'; // minutes

  return handle(() =>
    dflow(`/market/${encodeURIComponent(ticker)}/candlesticks`, {
      startTs,
      endTs,
      periodInterval,
    })
  );
}
```

### Task 2.5 — `app/api/markets/[ticker]/orderbook/route.ts`

```ts
import { dflow, handle } from '@/lib/dflow';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  return handle(() => dflow(`/orderbook/${encodeURIComponent(ticker)}`));
}
```

### Task 2.6 — `app/api/markets/[ticker]/trades/route.ts`

```ts
import { dflow, handle } from '@/lib/dflow';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(req.url);

  return handle(() =>
    dflow(`/onchain-trades/by-market/${encodeURIComponent(ticker)}`, {
      limit: searchParams.get('limit') ?? 50,
      cursor: searchParams.get('cursor') ?? undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  );
}
```

### Task 2.7 — `app/api/search/route.ts`

```ts
import { dflow, handle } from '@/lib/dflow';
import { isBinaryEvent, type DFlowEvent } from '@/lib/binary';

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get('q')?.trim();
    if (!q || q.length < 2) return { events: [], markets: [] };

    const data = await dflow<{ events?: DFlowEvent[]; markets?: any[] }>(
      '/search',
      { q }
    );

    return {
      events: (data.events ?? []).filter(isBinaryEvent),
      markets: data.markets ?? [],
    };
  });
}
```

### Task 2.8 — `app/api/filters/route.ts`

```ts
import { dflow, handle } from '@/lib/dflow';

export async function GET() {
  return handle(() => dflow('/tags_by_categories'));
}
```

**Phase 2 done when:** All 8 endpoints respond with 2xx and valid JSON via `curl`. If any return 5xx, fix before moving on. Don't proceed to UI until the proxy is stable.

---

## Phase 3 — React Query plumbing

### Task 3.1 — `app/providers.tsx`

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Wire into `app/layout.tsx`:

```tsx
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Task 3.2 — `lib/queries.ts`

```ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

const json = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `${r.status} ${r.statusText}`);
  }
  return r.json();
};

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => json('/api/dashboard'),
    staleTime: 60_000,
  });

export interface MarketsFilters {
  status?: string;
  category?: string;
  seriesTickers?: string;
}

export const useMarkets = (filters: MarketsFilters = {}) =>
  useInfiniteQuery({
    queryKey: ['markets', filters],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ cursor: String(pageParam ?? 0) });
      for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
      return json(`/api/markets?${qs.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (last: any) => last.nextCursor,
    staleTime: 30_000,
  });

export const useMarket = (ticker: string) =>
  useQuery({
    queryKey: ['market', ticker],
    queryFn: () => json(`/api/markets/${ticker}`),
    enabled: !!ticker,
    staleTime: 10_000,
  });

export const useCandles = (ticker: string, periodInterval = '60') =>
  useQuery({
    queryKey: ['candles', ticker, periodInterval],
    queryFn: () =>
      json(`/api/markets/${ticker}/candles?periodInterval=${periodInterval}`),
    enabled: !!ticker,
    staleTime: 60_000,
  });

export const useOrderbook = (ticker: string) =>
  useQuery({
    queryKey: ['orderbook', ticker],
    queryFn: () => json(`/api/markets/${ticker}/orderbook`),
    enabled: !!ticker,
    refetchInterval: 3_000,
    staleTime: 0,
  });

export const useTrades = (ticker: string) =>
  useQuery({
    queryKey: ['trades', ticker],
    queryFn: () => json(`/api/markets/${ticker}/trades`),
    enabled: !!ticker,
    refetchInterval: 5_000,
    staleTime: 0,
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => json(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

export const useFilters = () =>
  useQuery({
    queryKey: ['filters'],
    queryFn: () => json('/api/filters'),
    staleTime: 60 * 60_000,
  });
```

**Done when:** No type errors. Hooks are importable from `@/lib/queries`.

---

## Phase 4 — UI components (shared)

Build these before the pages — pages compose them.

### Task 4.1 — `components/Skeleton.tsx`

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />;
}

export function MarketCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
```

### Task 4.2 — `components/PriceBadge.tsx`

Renders YES/NO bid as a pair of pills. Handles null prices.

```tsx
import { priceToFloat, cents } from '@/lib/format';

interface Props {
  yesBid: string | null | undefined;
  noBid: string | null | undefined;
  size?: 'sm' | 'md';
}

export function PriceBadge({ yesBid, noBid, size = 'md' }: Props) {
  const yes = priceToFloat(yesBid);
  const no = priceToFloat(noBid);
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <div className="flex gap-1">
      <span className={`${padding} rounded bg-emerald-100 text-emerald-900 font-medium`}>
        YES {cents(yes)}
      </span>
      <span className={`${padding} rounded bg-rose-100 text-rose-900 font-medium`}>
        NO {cents(no)}
      </span>
    </div>
  );
}
```

### Task 4.3 — `components/MarketCard.tsx`

Renders one binary event. Used on dashboard, markets list, search results.

```tsx
import Link from 'next/link';
import type { DFlowEvent } from '@/lib/binary';
import { binaryMarket } from '@/lib/binary';
import { PriceBadge } from './PriceBadge';
import { closesIn, shortMoney } from '@/lib/format';

export function MarketCard({ event, showPrice = true }: { event: DFlowEvent; showPrice?: boolean }) {
  const market = binaryMarket(event);
  if (!market) return null; // defensive — should never happen if upstream filtered correctly

  return (
    <Link
      href={`/markets/${market.ticker}`}
      className="block border rounded-lg p-4 hover:border-neutral-400 transition"
    >
      <div className="flex items-start gap-3">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt=""
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2">{market.title}</h3>
          {event.subtitle && (
            <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{event.subtitle}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
            <span>{closesIn(market.closeTime)}</span>
            {event.volume24h != null && event.volume24h > 0 && (
              <span>{shortMoney(event.volume24h)} 24h vol</span>
            )}
          </div>
          {showPrice && (
            <div className="mt-2">
              <PriceBadge yesBid={market.yesBid} noBid={market.noBid} size="sm" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Image error handling note:** the `onError` handler hides broken images. Don't replace with a fallback image — the layout works without it.

### Task 4.4 — `components/SearchBox.tsx`

Debounces input, fires `useSearch` only after 250ms idle.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearch } from '@/lib/queries';
import Link from 'next/link';

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchBox() {
  const [input, setInput] = useState('');
  const debounced = useDebounced(input, 250);
  const { data, isLoading } = useSearch(debounced);

  const events = data?.events ?? [];
  const showResults = debounced.length >= 2;

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search markets..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />
      {showResults && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-96 overflow-auto z-10">
          {isLoading && <div className="p-3 text-sm text-neutral-500">Searching…</div>}
          {!isLoading && events.length === 0 && (
            <div className="p-3 text-sm text-neutral-500">
              No results for "{debounced}"
            </div>
          )}
          {events.map((e: any) => (
            <Link
              key={e.ticker}
              href={`/markets/${e.markets[0].ticker}`}
              onClick={() => setInput('')}
              className="block px-3 py-2 hover:bg-neutral-50 border-b last:border-b-0"
            >
              <div className="text-sm font-medium line-clamp-1">{e.markets[0].title}</div>
              {e.subtitle && (
                <div className="text-xs text-neutral-500 line-clamp-1">{e.subtitle}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Task 4.5 — `components/FilterBar.tsx`

```tsx
'use client';

import { useFilters } from '@/lib/queries';
import type { MarketsFilters } from '@/lib/queries';

const CATEGORIES = ['Sports', 'News', 'Politics', 'Crypto'];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'settled', label: 'Completed' },
];

export function FilterBar({
  filters,
  onChange,
}: {
  filters: MarketsFilters;
  onChange: (f: MarketsFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3 border-b">
      <span className="text-xs uppercase text-neutral-500 mr-1">Status</span>
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange({ ...filters, status: s.value })}
          className={`px-3 py-1 text-sm rounded-full border ${
            (filters.status ?? 'active') === s.value
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'border-neutral-300'
          }`}
        >
          {s.label}
        </button>
      ))}

      <span className="text-xs uppercase text-neutral-500 ml-3 mr-1">Category</span>
      <button
        onClick={() => onChange({ ...filters, category: undefined })}
        className={`px-3 py-1 text-sm rounded-full border ${
          !filters.category
            ? 'bg-neutral-900 text-white border-neutral-900'
            : 'border-neutral-300'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange({ ...filters, category: c })}
          className={`px-3 py-1 text-sm rounded-full border ${
            filters.category === c
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'border-neutral-300'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
```

---

## Phase 5 — Pages

### Task 5.1 — `app/page.tsx` (Dashboard)

```tsx
'use client';

import { useDashboard } from '@/lib/queries';
import { MarketCard } from '@/components/MarketCard';
import { MarketCardSkeleton } from '@/components/Skeleton';
import { SearchBox } from '@/components/SearchBox';
import Link from 'next/link';

export default function Dashboard() {
  const { data, isLoading, isError, error } = useDashboard();

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Binary markets</h1>
        <Link href="/markets" className="text-sm text-blue-600 hover:underline">
          All markets →
        </Link>
      </header>

      <div className="max-w-md">
        <SearchBox />
      </div>

      {isError && (
        <div className="border border-rose-300 bg-rose-50 text-rose-900 p-3 rounded">
          Failed to load: {(error as Error).message}
        </div>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">Top active</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => <MarketCardSkeleton key={i} />)}
          {data?.topActive.length === 0 && (
            <p className="text-sm text-neutral-500">No active markets right now.</p>
          )}
          {data?.topActive.map((e: any) => (
            <MarketCard key={e.ticker} event={e} showPrice={false} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Recent</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => <MarketCardSkeleton key={i} />)}
          {data?.recent.map((e: any) => (
            <MarketCard key={e.ticker} event={e} showPrice={false} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

### Task 5.2 — `app/markets/page.tsx` (All markets, infinite scroll)

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useMarkets, type MarketsFilters } from '@/lib/queries';
import { MarketCard } from '@/components/MarketCard';
import { MarketCardSkeleton } from '@/components/Skeleton';
import { FilterBar } from '@/components/FilterBar';
import { SearchBox } from '@/components/SearchBox';

export default function MarketsPage() {
  const [filters, setFilters] = useState<MarketsFilters>({ status: 'active' });
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMarkets(filters);

  const sentinel = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = sentinel.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((p: any) => p.items) ?? [];

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-4 max-w-md">
        <SearchBox />
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {isError && (
        <div className="mt-4 border border-rose-300 bg-rose-50 text-rose-900 p-3 rounded">
          Failed to load: {(error as Error).message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)}

        {!isLoading && allItems.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-neutral-500 mb-3">No markets in this filter.</p>
            <button
              onClick={() => setFilters({ status: 'active' })}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {allItems.map((e: any) => (
          <MarketCard key={e.ticker} event={e} />
        ))}

        {isFetchingNextPage &&
          Array.from({ length: 2 }).map((_, i) => <MarketCardSkeleton key={`load-${i}`} />)}
      </div>

      <div ref={sentinel} className="h-4" />
    </main>
  );
}
```

### Task 5.3 — `app/markets/[ticker]/page.tsx` (Market detail)

This page composes 4 hooks (`useMarket`, `useCandles`, `useOrderbook`, `useTrades`). Each renders independently — orderbook can be loading while market metadata is shown.

```tsx
'use client';

import { use } from 'react';
import { useMarket, useCandles, useOrderbook, useTrades } from '@/lib/queries';
import { Skeleton } from '@/components/Skeleton';
import { PriceBadge } from '@/components/PriceBadge';
import { OrderbookLadder } from '@/components/OrderbookLadder';
import { CandleChart } from '@/components/CandleChart';
import { TradeFeed } from '@/components/TradeFeed';
import { closesIn, shortMoney } from '@/lib/format';

export default function MarketDetail({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const market = useMarket(ticker);
  const candles = useCandles(ticker);
  const orderbook = useOrderbook(ticker);
  const trades = useTrades(ticker);

  if (market.isError) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <div className="border border-rose-300 bg-rose-50 text-rose-900 p-3 rounded">
          Market not found: {(market.error as Error).message}
        </div>
      </main>
    );
  }

  const m = market.data?.market;

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        {market.isLoading ? (
          <>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">{m?.title}</h1>
            {m?.subtitle && <p className="text-neutral-500 mt-1">{m.subtitle}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
              <span>{closesIn(m?.closeTime)}</span>
              {m?.volume != null && <span>{shortMoney(m.volume)} volume</span>}
            </div>
            <div className="mt-3">
              <PriceBadge yesBid={m?.yesBid} noBid={m?.noBid} />
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <section>
        <h2 className="text-sm font-medium text-neutral-500 mb-2">Price history</h2>
        <CandleChart query={candles} />
      </section>

      {/* Orderbook + Trades side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium text-neutral-500 mb-2">Orderbook</h2>
          <OrderbookLadder query={orderbook} />
        </section>
        <section>
          <h2 className="text-sm font-medium text-neutral-500 mb-2">Recent trades</h2>
          <TradeFeed query={trades} />
        </section>
      </div>

      {/* Rules */}
      {m?.rulesPrimary && (
        <section>
          <h2 className="text-sm font-medium text-neutral-500 mb-2">Rules</h2>
          <p className="text-sm whitespace-pre-line">{m.rulesPrimary}</p>
          {m.rulesSecondary && (
            <p className="text-sm text-neutral-500 mt-2 whitespace-pre-line">
              {m.rulesSecondary}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
```

### Task 5.4 — `components/OrderbookLadder.tsx`

```tsx
import { Skeleton } from './Skeleton';
import { priceToFloat, cents } from '@/lib/format';

export function OrderbookLadder({ query }: { query: any }) {
  if (query.isLoading) {
    return <Skeleton className="h-48" />;
  }
  if (query.isError) {
    return <p className="text-sm text-rose-600">Failed to load orderbook.</p>;
  }

  const data = query.data;
  const yesBids = entriesSortedDesc(data?.yes_bids);
  const noBids = entriesSortedDesc(data?.no_bids);

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <Side label="YES bids" entries={yesBids} color="emerald" />
      <Side label="NO bids" entries={noBids} color="rose" />
    </div>
  );
}

function entriesSortedDesc(obj: Record<string, number> | undefined): [number, number][] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([p, s]) => [priceToFloat(p) ?? 0, s] as [number, number])
    .sort((a, b) => b[0] - a[0])
    .slice(0, 8);
}

function Side({
  label,
  entries,
  color,
}: {
  label: string;
  entries: [number, number][];
  color: 'emerald' | 'rose';
}) {
  return (
    <div>
      <div className={`text-xs uppercase text-${color}-700 mb-1`}>{label}</div>
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-400">No bids</p>
      ) : (
        <table className="w-full">
          <tbody>
            {entries.map(([price, size]) => (
              <tr key={price} className="border-b last:border-0">
                <td className={`py-1 text-${color}-900 font-medium`}>{cents(price)}</td>
                <td className="py-1 text-right text-neutral-600">
                  {size.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Task 5.5 — `components/CandleChart.tsx`

Uses `recharts`. The data shape will need inspection on first run — check `docs/api/candlesticks.md` for the response field names. Common variants are `{ ts, open, high, low, close, volume }` or similar.

```tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from './Skeleton';
import { priceToFloat } from '@/lib/format';

export function CandleChart({ query }: { query: any }) {
  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.isError) return <p className="text-sm text-rose-600">Failed to load chart.</p>;

  const raw: any[] = query.data?.candlesticks ?? query.data?.candles ?? query.data ?? [];
  if (!Array.isArray(raw) || raw.length === 0) {
    return <p className="text-sm text-neutral-500 py-8 text-center">No price history yet.</p>;
  }

  const data = raw.map((c: any) => ({
    ts: c.ts ?? c.timestamp ?? c.startTs,
    yes: priceToFloat(c.close ?? c.yesPrice ?? c.yesClose),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            tickFormatter={(ts) =>
              new Date(ts * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
            fontSize={11}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}¢`}
            fontSize={11}
            width={40}
          />
          <Tooltip
            formatter={(v: any) => `${Math.round(v * 100)}¢`}
            labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Note:** the actual candlestick response field names need to be verified once you have a real ticker that returns data. Adjust the field-extraction line. Don't guess on first try — `console.log(query.data)` and check.

### Task 5.6 — `components/TradeFeed.tsx`

```tsx
import { Skeleton } from './Skeleton';
import { priceToFloat, cents } from '@/lib/format';

export function TradeFeed({ query }: { query: any }) {
  if (query.isLoading) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-sm text-rose-600">Failed to load trades.</p>;

  const trades: any[] = query.data?.trades ?? [];
  if (trades.length === 0) {
    return <p className="text-sm text-neutral-500 py-4">No trades yet.</p>;
  }

  return (
    <ul className="text-sm divide-y">
      {trades.slice(0, 10).map((t: any) => {
        const price = priceToFloat(t.yesPriceDollars ?? t.yesPrice ?? t.price);
        const isBuy = t.takerSide === 'YES' || t.takerSide === 'yes';
        return (
          <li
            key={t.tradeId ?? t.id}
            className="py-2 flex items-center justify-between"
          >
            <span
              className={`font-medium ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {isBuy ? 'Buy YES' : 'Buy NO'}
            </span>
            <span className="text-neutral-600">
              {(t.count ?? 0).toLocaleString()} @ {cents(price)}
            </span>
            <span className="text-xs text-neutral-400">
              {timeAgo(t.createdTime ?? t.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function timeAgo(unixSec: number | undefined): string {
  if (!unixSec) return '';
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
```

---

## Phase 6 — Final checks before demo

Run through each item. Don't skip.

### 6.1 — Compile + lint
```bash
npx tsc --noEmit
npm run lint
```

### 6.2 — Audit for direct DFlow calls
```bash
grep -r "dflow.net" app/ components/ lib/queries.ts lib/binary.ts lib/format.ts
```
Should return **nothing**. If anything matches, that's a CORS bug waiting to happen.

### 6.3 — Audit for API key leakage
```bash
grep -r "DFLOW_API_KEY" app/ components/ lib/queries.ts
```
Should return **nothing**. The key only appears in `lib/dflow.ts`.

### 6.4 — Test all routes manually
```bash
# Each should return 2xx with valid JSON
curl -i http://localhost:3000/api/dashboard
curl -i 'http://localhost:3000/api/markets?status=active'
curl -i 'http://localhost:3000/api/markets?status=settled&category=Sports'
curl -i 'http://localhost:3000/api/search?q=bitcoin'
curl -i http://localhost:3000/api/filters
# Pick a real ticker from the markets list:
curl -i http://localhost:3000/api/markets/SOMETICKER
curl -i http://localhost:3000/api/markets/SOMETICKER/orderbook
curl -i http://localhost:3000/api/markets/SOMETICKER/trades
curl -i http://localhost:3000/api/markets/SOMETICKER/candles
```

### 6.5 — Browser sanity
- Open `localhost:3000` in **incognito** (no cached state).
- Open dev tools → Network tab. Confirm:
  - All requests go to `localhost:3000/api/*`
  - Zero requests to `*.dflow.net` from the browser.
- Open dev tools → Console. Confirm zero CORS errors.

### 6.6 — Demo flow rehearsal
1. Land on dashboard. Cards render with skeletons → real data.
2. Click "All markets". Scroll. New cards load.
3. Apply category filter "Crypto". List refilters.
4. Switch to "Completed". Different markets appear.
5. Use search box for a known keyword. Dropdown shows results.
6. Click a market. Detail page loads chart + orderbook + trades. Orderbook updates every 3s (visible if you watch the React Query devtools).
7. Click back. List position is preserved (React Query cache).

### 6.7 — Switch to prod (only if you have a key)
```bash
# .env.local
DFLOW_ENV=prod
DFLOW_API_KEY=<your_key>
```
Restart server. Re-run section 6.4. Frontend should be unchanged.

---

## What to NOT do (common pitfalls)

- **Don't** call DFlow directly from a `'use client'` component. Always go through `/api/*`.
- **Don't** add `isInitialized=true` to event/market list calls. It hides most markets.
- **Don't** treat orderbook absence as an error. Empty `yes_bids: {}` is valid.
- **Don't** crash on null `volume24h`, `subtitle`, `imageUrl`. Coalesce.
- **Don't** assume candlestick field names without checking — `console.log(query.data)` first.
- **Don't** `as any` to make TypeScript happy. If a type is wrong, fix the type in `lib/binary.ts`.
- **Don't** mutate React Query data. Use `select` if you need a derived shape.
- **Don't** add a database, Redis, or background jobs — they're explicitly out of scope.
