# DFlow Binary Markets — Project Context

> Read this file completely before reading `task.md` or making any changes.
> When in doubt about an endpoint shape, read `docs/api/<endpoint>.md` — those files are the canonical reference for this codebase.

---

## What we're building

A Next.js (App Router, TypeScript) hackathon app for **binary prediction markets** on DFlow. Users browse YES/NO event markets like `KXLAYOFFSYINFO-26` ("More tech layoffs in 2026 than in 2025?"), see live prices, drill into orderbook + candles + trade history, and search.

**Out of scope for the hackathon:** wallet connection, KYC, actually placing trades, redemption flows. We're read-only against DFlow's Metadata API.

---

## Why we have a backend at all (read this — it's the whole reason)

**DFlow's API does not set CORS headers.** Browsers block direct `fetch()` calls from the frontend. The backend exists to:

1. **Proxy DFlow requests** so the browser hits same-origin URLs (no preflight, no CORS error).
2. **Hide the production API key** in the `x-api-key` header (must never reach the browser).
3. **Filter to binary events only** — DFlow has no `binary=true` flag; we identify binary by structure.
4. **Switch dev/prod endpoints** via env var without touching frontend code.

We're **NOT** building:
- A database (DFlow is the source of truth).
- A background job queue (React Query handles refetching).
- A WebSocket relay (3–5s polling is fine for the demo; can swap later).
- An auth layer (read-only public data).

If a feature you're about to add isn't on the "why we have a backend" list above, stop and ask.

---

## What "binary market" means here

DFlow events come in two structural shapes:

| Shape | Example | `event.markets.length` |
|---|---|---|
| **Binary** | "Will Bitcoin be above $100k on Dec 31, 2026?" → 1 YES/NO market | `=== 1` |
| **Multi-outcome** | "Who wins the 2028 election?" → many markets, one per candidate | `> 1` |

**Our app shows ONLY binary events.** Filtering happens server-side in the proxy via the `isBinaryEvent()` helper in `lib/binary.ts`. Frontend never sees multi-outcome events.

This means: always fetch events with `withNestedMarkets=true`, then filter `event.markets.length === 1`. Never list bare markets — you lose the event grouping needed to identify binary-ness.

---

## Architecture (one paragraph)

```
Browser ──fetch──> Next.js API route (same origin, /api/*)
                        │
                        ├─ adds x-api-key (prod only)
                        ├─ filters to binary events
                        └──HTTP──> DFlow Metadata API
                                   (dev or prod base URL)

React Query owns: client cache, retries, refetch intervals, stale times.
Proxy owns: CORS bypass, key handling, binary filtering, response shaping.
```

---

## Project structure (target state)

```
app/
  api/
    dashboard/route.ts                          → top 5 active + 5 recent
    filters/route.ts                            → tags by category for filter UI
    markets/
      route.ts                                  → paginated list with filters
      [ticker]/
        route.ts                                → single market metadata + price
        candles/route.ts                        → candlesticks for chart
        orderbook/route.ts                      → bid ladders for both YES and NO
        trades/route.ts                         → recent onchain trades
    search/route.ts                             → full-text search (binary only)
  layout.tsx                                    → wraps in <Providers>
  providers.tsx                                 → React Query client + devtools
  page.tsx                                      → Dashboard
  markets/page.tsx                              → All markets (paginated)
  markets/[ticker]/page.tsx                     → Market detail view

lib/
  dflow.ts                                      → fetch wrapper, env switch, error class
  binary.ts                                     → isBinaryEvent + types
  queries.ts                                    → all React Query hooks
  format.ts                                     → price/volume/time formatters

components/
  MarketCard.tsx                                → compact market preview
  PriceBadge.tsx                                → YES%/NO% display
  OrderbookLadder.tsx                           → bid ladder rendering
  CandleChart.tsx                               → price chart (recharts)
  TradeFeed.tsx                                 → recent trades list
  SearchBox.tsx                                 → debounced search input
  FilterBar.tsx                                 → status + category filters
  Skeleton.tsx                                  → loading placeholders

docs/api/                                       → CANONICAL API REFERENCE
  README.md                                     → index, quick reference
  events.md                                     → GET /api/v1/events
  market.md                                     → GET /api/v1/market/{ticker}
  orderbook.md                                  → GET /api/v1/orderbook/{ticker}
  candlesticks.md                               → GET /api/v1/market/{ticker}/candlesticks
  trades.md                                     → GET /api/v1/onchain-trades/by-market/{ticker}
  search.md                                     → GET /api/v1/search
  tags.md                                       → GET /api/v1/tags_by_categories
```

---

## Critical DFlow API facts (memorize these)

These are non-obvious gotchas that will burn hours if you skip them.

### 1. Endpoints
- **Dev (no key):** `https://dev-prediction-markets-api.dflow.net`
- **Prod (key required, sent as `x-api-key` header):** `https://prediction-markets-api.dflow.net`
- All paths prefix with `/api/v1`.

### 2. Orderbook returns ONLY bid ladders
The orderbook response has `yes_bids` and `no_bids` — no `asks`. To compute the YES ask price, take `1 - bestNoBid`. To compute the NO ask price, take `1 - bestYesBid`. This is the entire model: a YES bid at 0.62 means someone will pay 62¢ for YES, which equals selling NO at 38¢.

```json
{
  "sequence": 4169465,
  "yes_bids": { "0.6100": 5000, "0.6000": 12000 },
  "no_bids":  { "0.3700": 3000, "0.3600": 8500 }
}
```

Prices are 4-decimal probability strings ("0.6100"), values are size integers. Don't compare price strings — `parseFloat()` first.

### 3. Prices on trades and markets are 0-10000 scale
A trade with `price: 6200` means 62¢. A market's `yesBid: "0.6100"` is a string. There are also `yesPriceDollars: "0.62"` fields on trades. **Always normalize to 0–1 floats in `format.ts` before display.**

### 4. Candlesticks have a hard 5000-row cap
`startTs` + `endTs` + `periodInterval` (in minutes) must produce ≤5000 points or you get a 400. The frontend MUST pick `periodInterval` based on visible range:

| Range | periodInterval | Candle count |
|---|---|---|
| Last 1h | 1 | 60 |
| Last 24h | 60 | 24 |
| Last 7d | 60 | 168 |
| Last 30d | 1440 (1d) | 30 |
| All time | 1440 | bounded by market age |

`candles/route.ts` defaults to last 24h at `periodInterval=60`. The frontend must override for other ranges.

### 5. `isInitialized=true` filter excludes most markets
DFlow markets are tokenized lazily — only when first traded through DFlow. If you pass `isInitialized=true`, you'll only see markets that have already been traded onchain. **For listing/discovery, OMIT this parameter.** Many active Kalshi markets have `isInitialized=false` and that's fine — we don't care for read-only browsing.

### 6. Kalshi maintenance window
Thursdays 3–5 AM ET, the orderbook will look frozen. Don't treat this as a bug. (Not a code change — just a thing to know during demo prep.)

### 7. Events have `volume24h`, markets have `volume`
For "top active markets" ranking on the dashboard, sort events by `volume24h DESC` (it's null on quiet events — coalesce to 0). Don't use `event.volume` (lifetime, not recency).

### 8. Search query rules
`/api/v1/search?q=...` does multi-token AND match. "tech layoffs" requires both tokens. Tickers (uppercase) match case-insensitively. It searches `title`, `subtitle`, `yes_sub_title`, `no_sub_title`, and ticker fields — **not** tags or categories. To filter by category, use the events endpoint, not search.

### 9. Categories and tags
Use `/api/v1/tags_by_categories` to populate filter UI. Returns `{ tagsByCategories: { Sports: [...], Crypto: [...], Politics: [...], News: [...], ... } }`. Categories are the top-level filter (the four asked for: Sports, News, Politics, Crypto, plus a "Completed" status pseudo-filter that maps to `status=settled`). Tags are sub-filters.

### 10. The "Completed" filter is a status filter, not a category
The user-facing requirement listed "completed" alongside sports/news/politics/crypto. **Completed is a status, not a category.** When a user selects "Completed", we send `status=settled` (or `status=closed`); when they select "Sports", we send `category=Sports`. These are independent axes — handle them in `markets/route.ts` as separate query params.

---

## Conventions

### Frontend → Backend contract
- **All client fetches go through `/api/*`.** Never `fetch('https://...dflow.net')` from the browser.
- All proxy routes return `{ error: string }` on failure with a non-2xx status. React Query throws on these; UI shows error states.
- Pagination: cursor-based, server returns `{ items, nextCursor }`. `nextCursor: null` means end.
- Empty results return `{ items: [] }`, never an error.

### Naming
- Routes use Kalshi/DFlow terminology: "ticker" not "id", "event" vs "market" distinction matters.
- Hooks in `lib/queries.ts` are named `use<Noun>` (e.g. `useMarket`, `useCandles`).
- Components are `PascalCase`, files match the export name.

### React Query defaults
Defined in `app/providers.tsx`:
- `staleTime: 30s` (most data)
- `gcTime: 5min`
- `retry: 2`
- `refetchOnWindowFocus: false` (annoying for demos)

Per-hook overrides: orderbook polls every 3s, trades every 5s, search has 5min staleTime.

### Error handling
- Backend: `try/catch` in every route, return `{ error: message }` with the upstream status code.
- Frontend: every component using a query renders three states — `isLoading`, `isError`, success. Never assume data exists.
- Never crash on null/undefined fields — DFlow fields like `volume24h`, `subtitle`, `imageUrl` can be null.

### TypeScript
- `strict: true` everywhere.
- Don't `as any`. If a DFlow field shape is unknown, type it as `unknown` and narrow.
- Shared types live in `lib/binary.ts` (events, markets) and route response types are inline.

---

## UI mapping — which API drives which screen

This is the contract between proxy routes and UI components. When you change a route, check this table.

| UI screen / component | Endpoint | Hook | Key data fields |
|---|---|---|---|
| Dashboard — Top 5 Active | `GET /api/dashboard` | `useDashboard()` | `topActive[]`, no per-market price (UI shows title only) |
| Dashboard — Recent 5 | `GET /api/dashboard` | `useDashboard()` | `recent[]` |
| Markets list (infinite scroll) | `GET /api/markets?cursor=&status=&category=` | `useMarkets(filters)` | `items[]` with `yesBid`, `noBid`, `volume24h`; `nextCursor` |
| Filter bar | `GET /api/filters` | `useFilters()` | `tagsByCategories.{Sports,Crypto,...}` |
| Search box (after 2+ chars debounced) | `GET /api/search?q=` | `useSearch(q)` | `events[]`, `markets[]` (binary only) |
| Market detail header | `GET /api/markets/:ticker` | `useMarket(ticker)` | `title`, `yesSubTitle`, `closeTime`, `volume`, `yesBid`/`yesAsk` |
| Market detail chart | `GET /api/markets/:ticker/candles?periodInterval=` | `useCandles(ticker, interval)` | OHLCV array |
| Market detail orderbook | `GET /api/markets/:ticker/orderbook` | `useOrderbook(ticker)` (3s poll) | `yes_bids`, `no_bids` |
| Market detail trades | `GET /api/markets/:ticker/trades` | `useTrades(ticker)` (5s poll) | `trades[]` with `price`, `count`, `takerSide`, `createdTime` |

---

## Failure modes and how to NOT break the UI

These are the corner cases that have killed similar apps. Handle every one.

### Loading states
Every screen uses skeletons (see `components/Skeleton.tsx`), not spinners. Skeletons preserve layout — no jank when data arrives. Never render an empty `<div>` while waiting.

### Empty states
- **No markets match filters:** show "No markets in this category yet" + a "Clear filters" button.
- **No trades on market:** show "No trades yet" — don't show an empty list with no message.
- **Empty orderbook (`yes_bids` or `no_bids` is `{}`):** show "No bids on this side" — common for thin markets.
- **Search returns nothing:** "No results for «query»" — quote the query so user sees what was searched.

### Null/missing fields
- `volume24h`, `liquidity`, `openInterest`, `imageUrl`, `subtitle` can ALL be null. Coalesce to 0 / "" / placeholder image.
- `yesBid`/`noBid` can be null on markets with no liquidity. Show "—" not "null" or "0¢".
- `closeTime` of 0 or null means open-ended — don't render "Closes Jan 1, 1970".

### Stale data during refetch
React Query keeps previous data visible while refetching by default — good. Don't override this. Use `isFetching` for a subtle indicator (small dot in corner), `isLoading` for full skeleton (only on initial load).

### Pagination edge cases
- User scrolls fast and triggers `fetchNextPage()` while previous is in flight: React Query dedupes — you don't need to.
- `nextCursor: null` arrives mid-scroll: the IntersectionObserver/sentinel must be removed. `useInfiniteQuery` exposes `hasNextPage` — use it.
- After filter change, scroll resets to top. The `queryKey` includes filters → new query → new data. Don't try to merge.

### Polling tabs
3s orderbook polling uses bandwidth. `refetchOnWindowFocus: false` is set globally, but consider stopping polling when tab is hidden (`refetchIntervalInBackground: false` is the default — fine).

### Race conditions on detail page
User opens market A, then quickly clicks market B before A's queries resolve. React Query handles this via per-key caching — data for A is still in cache, data for B starts fresh. Don't write code that assumes a single market is "current".

### CORS misconfig (the thing that started this)
If you EVER see `Access-Control-Allow-Origin` errors in the console, someone wrote a `fetch('https://*.dflow.net')` call directly. That's a bug. All client calls go to `/api/*`. The proxy is the only thing that talks to DFlow.

### API key leakage
The `DFLOW_API_KEY` env var must NEVER appear in `lib/queries.ts`, any component, or any `app/*/page.tsx` file. It only exists in `lib/dflow.ts`. To audit: `grep -r "DFLOW_API_KEY" app/ components/ lib/queries.ts` should return nothing.

### Demo-day specific
- **Test on a fresh browser session before the demo.** React Query's persisted cache can mask broken cold-start paths.
- **Have a fallback market ticker known to have liquidity** hardcoded somewhere — if the dashboard returns markets with no trades, the demo looks dead. `KXBTC` series tends to be reliable.
- **Disable orderbook polling during the demo presentation if network is iffy.** Easy toggle: env var or a dev flag.

---

## How to use the `docs/api/` directory

`docs/api/<endpoint>.md` files are the canonical reference for what each upstream DFlow endpoint accepts and returns. **Read the relevant doc before implementing or modifying any proxy route.** They contain:

- Exact URL pattern
- Query parameters and their effects (especially `withNestedMarkets`, `isInitialized`, `seriesTickers`)
- Response shape with field types and nullability
- Known gotchas
- Example request/response

They exist because Claude Code can't browse the DFlow MCP server during execution — the docs are inlined into the repo so reading them is a `view` call, not a network call.

---

## Definition of done

A route or component is done when:
1. It handles loading, error, and empty states explicitly.
2. It's typed (no `any`).
3. Manual test passes against the dev DFlow endpoint.
4. The "Failure modes" section above has been re-read and each applicable case is handled.
5. No direct DFlow URL appears in client-side code (`grep "dflow.net" app/ components/ lib/queries.ts` returns nothing).

---

## Where to start

Read `task.md` next. It lists the build order. Don't start at the UI — start at `lib/dflow.ts` and work outward.
