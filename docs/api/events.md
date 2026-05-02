# `GET /events`

The most important endpoint in this app. Drives the dashboard and the paginated markets list. Returns events; with `withNestedMarkets=true` it includes their child markets, which is how we identify binary events.

## Used by

- `app/api/dashboard/route.ts`
- `app/api/markets/route.ts`

## Full URL

```
GET {BASE}/api/v1/events?{params}
```

## Query parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `withNestedMarkets` | `boolean` | **always pass `true`** | Without this, you get events but no `markets[]` array, which means you can't tell binary from multi-outcome. |
| `limit` | `integer` | No (default ~100) | Max results. Always overfetch (3×) because we filter to binary client-side. |
| `offset` | `integer` | No (default 0) | Pagination offset (used for cursor in our proxy). |
| `status` | `string` | No | One of: `active`, `initialized`, `settled`, `closed`, `expired`. We use `active` for "live markets" and `settled` for "Completed" filter. |
| `category` | `string` | No | E.g. `Sports`, `News`, `Politics`, `Crypto`, `Economics`. Case-sensitive. Get the canonical list from `/tags_by_categories`. |
| `tags` | `string` | No | Comma-separated tag list, e.g. `Football,Soccer`. Combine with `category` for narrower results. |
| `seriesTickers` | `string` | No | Comma-separated, e.g. `KXBTC,KXSOL`. Filters to events under specific series (asset families). |
| `isInitialized` | `boolean` | **NEVER pass** | Filters to only DFlow-tokenized markets — hides most live ones. See the cross-cutting facts in `README.md`. |

## Response shape

```json
{
  "events": [
    {
      "ticker": "KXLAYOFFS-26",
      "seriesTicker": "KXLAYOFFS",
      "title": "Tech layoffs in 2026",
      "subtitle": "Will more tech workers be laid off in 2026 than 2025?",
      "imageUrl": "https://...",
      "category": "News",
      "liquidity": 145000,
      "openInterest": 89000,
      "volume": 1240000,
      "volume24h": 285000,
      "strikeDate": 1798761600,
      "strikePeriod": "2026",
      "settlementSources": [
        { "name": "Layoffs.fyi", "url": "https://layoffs.fyi" }
      ],
      "createdAt": 1718456400,
      "markets": [
        {
          "ticker": "KXLAYOFFSYINFO-26",
          "eventTicker": "KXLAYOFFS-26",
          "marketType": "binary",
          "title": "More tech layoffs in 2026 than in 2025?",
          "subtitle": "...",
          "yesSubTitle": "Yes, more layoffs in 2026",
          "noSubTitle": "No, fewer layoffs in 2026",
          "openTime": 1718456400,
          "closeTime": 1798761600,
          "expirationTime": 1798848000,
          "status": "active",
          "result": null,
          "volume": 1240000,
          "openInterest": 89000,
          "yesBid": "0.6100",
          "yesAsk": "0.6300",
          "noBid": "0.3700",
          "noAsk": "0.3900",
          "rulesPrimary": "...",
          "rulesSecondary": null,
          "accounts": {
            "USDC": {
              "marketLedger": "...",
              "yesMint": "Ey3BjK...",
              "noMint": "AxR7pK...",
              "isInitialized": true,
              "redemptionStatus": null
            }
          }
        }
      ]
    }
  ]
}
```

### Field nullability

These can be `null` even on healthy events — frontend must handle:
- `subtitle`, `imageUrl`, `liquidity`, `openInterest`, `volume`, `volume24h`, `strikeDate`, `strikePeriod`, `settlementSources`, `createdAt`
- On nested markets: `result`, `volume`, `openInterest`, `yesBid`, `yesAsk`, `noBid`, `noAsk`, `rulesSecondary`, `subtitle`

`markets` will be `undefined` if `withNestedMarkets` is omitted. With it, the array is always present (possibly empty).

## Pagination and overfetch

The proxy in `app/api/markets/route.ts` overfetches 3× the page size because we filter to binary events client-side. If 60 events come back and only 22 are binary, we return the first 20 binary ones and signal there are more.

```ts
const PAGE_SIZE = 20;
const OVERFETCH = 3;

const { events } = await dflow('/events', {
  withNestedMarkets: true,
  limit: PAGE_SIZE * OVERFETCH,  // 60
  offset: cursor,
});

const binary = events.filter(isBinaryEvent).slice(0, PAGE_SIZE);
const hasMore = events.length === PAGE_SIZE * OVERFETCH;
```

If you find the dev API returns mostly multi-outcome (rare), bump `OVERFETCH` to 5. If you find it's almost all binary, drop to 1.5 — but verify the binary ratio in your demo dataset first.

## Common gotchas

1. **Forgot `withNestedMarkets=true`** → `event.markets` is undefined → `isBinaryEvent` returns false → empty list. Always pass it.
2. **Passed `isInitialized=true`** → most markets disappear. Don't.
3. **Sorted by `volume` for "top active"** → that's lifetime volume; new markets never reach the top. Use `volume24h` (with `?? 0` fallback for nullable).
4. **Used `event.title` for the market card** → that's the question family. Use `event.markets[0].title` for the actual binary question. The dashboard card calls `binaryMarket(event)` to get the right one.

## Example: dashboard payload composition

```ts
// In /api/dashboard
const { events } = await dflow('/events', {
  withNestedMarkets: true,
  status: 'active',
  limit: 100,                    // overfetch heavily; we want best-of
});

const binary = events.filter(isBinaryEvent);

const topActive = [...binary]
  .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
  .slice(0, 5);

const recent = [...binary]
  .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  .slice(0, 5);
```

## Related

- For drilling into a single market by its ticker, use `/market/{ticker}` — see [`market.md`](./market.md).
- Categories and tags for the filter UI come from [`tags.md`](./tags.md).
