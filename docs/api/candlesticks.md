# `GET /market/{ticker}/candlesticks`

OHLC-style price history for charting.

## Used by

- `app/api/markets/[ticker]/candles/route.ts`
- Frontend: `CandleChart` component; `useCandles(ticker, periodInterval)` hook.

## Full URL

```
GET {BASE}/api/v1/market/{market_ticker}/candlesticks?startTs=&endTs=&periodInterval=
```

## Query parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `startTs` | int (Unix sec) | Yes | Start of time range. |
| `endTs` | int (Unix sec) | Yes | End of time range. |
| `periodInterval` | int (minutes) | Yes | Candle width in minutes. Common: `1`, `5`, `15`, `60`, `1440` (1 day). |

The proxy defaults to `endTs = now`, `startTs = now - 24h`, `periodInterval = 60`. Frontend can override.

## The 5000 cap — non-negotiable

`(endTs - startTs) / (periodInterval * 60)` must be ≤ 5000 or you get a **400 error**.

| Range | Min `periodInterval` |
|---|---|
| 1 hour | 1 minute (60 candles) |
| 24 hours | 1 minute (1,440 candles) — fits |
| 7 days | 5 minutes (2,016 candles) — fits, but 1m would be 10,080 → 400 error |
| 30 days | 60 minutes (720 candles) — fits |
| 90 days | 60 minutes (2,160 candles) — fits |
| 1 year | 1440 (1 day, 365 candles) |

**Pick `periodInterval` based on the visible range, never let the user pick "1m" with a "30d" range without computing.**

## Response shape

The exact response shape needs verification on first run — the docs are sparse on this. Likely candidates based on common DFlow conventions:

```json
{
  "candlesticks": [
    {
      "ts": 1746086400,
      "open": 0.61,
      "high": 0.63,
      "low": 0.60,
      "close": 0.62,
      "volume": 45000
    }
  ]
}
```

OR it may be:

```json
{
  "candles": [
    { "startTs": 1746086400, "yesOpen": 0.61, "yesHigh": 0.63, ... }
  ]
}
```

**On first run, `console.log(data)` from the proxy and adjust the chart component's field-extraction line.** The `CandleChart` component already has fallback logic for both shapes:

```ts
const raw = query.data?.candlesticks ?? query.data?.candles ?? query.data ?? [];
const data = raw.map((c) => ({
  ts: c.ts ?? c.timestamp ?? c.startTs,
  yes: priceToFloat(c.close ?? c.yesPrice ?? c.yesClose),
}));
```

## Common gotchas

1. **Forgot to pass timestamps in seconds, not ms.** Multiplied by 1000 before sending → 400. Always `Math.floor(Date.now() / 1000)`.
2. **Hardcoded `periodInterval=1`** then asked for a week of data → 400. Always derive from range.
3. **Empty candles array** — valid for new markets with no trades yet. Show "No price history yet" message.
4. **Closed/settled markets return historical candles** but no new ones. That's expected.
5. **Y-axis scale** — always `[0, 1]` for binary markets (probabilities), not `'auto'`. `recharts` auto-scaling on a near-flat market makes the chart look chaotic.

## Range/interval selector pattern

If you add a range picker (1H / 24H / 7D / 30D buttons), compute interval client-side:

```ts
function pickInterval(rangeSec: number): string {
  // Aim for ~100-500 candles per chart for readability
  if (rangeSec <= 3600) return '1';            // 1h → 1m candles → 60 points
  if (rangeSec <= 86400) return '15';          // 24h → 15m → 96 points
  if (rangeSec <= 7 * 86400) return '60';      // 7d → 1h → 168 points
  if (rangeSec <= 30 * 86400) return '240';    // 30d → 4h → 180 points
  return '1440';                                // 90d+ → 1d
}
```

Pass to `useCandles(ticker, interval)`.

## Related

- [`trades.md`](./trades.md) — actual executions vs. aggregated candles.
- The DFlow FAQ confirms: "Use candlesticks for charting and user-facing price history. Forecast history is for research only." So we use this endpoint, not forecast endpoints.
