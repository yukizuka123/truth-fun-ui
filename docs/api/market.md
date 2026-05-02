# `GET /market/{ticker}`

Single market lookup by ticker. Returns full market metadata plus current best bid/ask for both YES and NO.

## Used by

- `app/api/markets/[ticker]/route.ts` (drives the market detail page header)

## Full URL

```
GET {BASE}/api/v1/market/{market_ticker}
```

`{market_ticker}` is the market-level ticker like `KXLAYOFFSYINFO-26`, **not** the event ticker. (Events have their own ticker like `KXLAYOFFS-26`. Each binary event has exactly one market under it; the market ticker is what we use for routing in this app.)

## Query parameters

None for our use case. Pass the ticker in the path.

## Response shape

```json
{
  "market": {
    "ticker": "KXLAYOFFSYINFO-26",
    "eventTicker": "KXLAYOFFS-26",
    "marketType": "binary",
    "title": "More tech layoffs in 2026 than in 2025?",
    "subtitle": "Tech sector layoff count comparison year over year",
    "yesSubTitle": "Yes, more in 2026",
    "noSubTitle": "No, fewer in 2026",
    "openTime": 1718456400,
    "closeTime": 1798761600,
    "expirationTime": 1798848000,
    "status": "active",
    "result": null,
    "canCloseEarly": false,
    "earlyCloseCondition": null,
    "volume": 1240000,
    "openInterest": 89000,
    "yesBid": "0.6100",
    "yesAsk": "0.6300",
    "noBid": "0.3700",
    "noAsk": "0.3900",
    "rulesPrimary": "Resolves YES if the total number of tech layoffs reported by Layoffs.fyi for calendar year 2026 exceeds the 2025 total...",
    "rulesSecondary": "Reference data: https://layoffs.fyi",
    "accounts": {
      "USDC": {
        "marketLedger": "8K2g...",
        "yesMint": "Ey3BjK...",
        "noMint": "AxR7pK...",
        "isInitialized": true,
        "redemptionStatus": null,
        "scalarOutcomePct": null
      }
    }
  }
}
```

Note the response wraps the market in a `{ market: {...} }` envelope. Don't forget to access `.market`.

### Field reference

| Field | Type | Notes |
|---|---|---|
| `ticker` | string | Market ticker. |
| `eventTicker` | string | Parent event ticker. Use this if you need to fetch the parent event later. |
| `marketType` | string | `"binary"` for our markets. |
| `title` | string | The actual YES/NO question. **This is what to show on the detail page header.** |
| `subtitle` | string \| null | Optional context; render below the title if present. |
| `yesSubTitle` | string | Label for the YES outcome (e.g. "Yes, more in 2026"). Used near the YES button. |
| `noSubTitle` | string | Label for the NO outcome. |
| `openTime` | int | Unix sec. When market opened for trading. |
| `closeTime` | int | Unix sec. When market closes. **0 or null = open-ended; don't render "1970".** |
| `expirationTime` | int | Unix sec. When the market actually settles. |
| `status` | string | `active`, `initialized`, `settled`, `closed`, `expired`. |
| `result` | string \| null | `"YES"`, `"NO"`, or null if unsettled. |
| `volume` | int \| null | Lifetime volume in settlement-mint units. |
| `openInterest` | int \| null | Current open interest. |
| `yesBid`, `yesAsk` | string \| null | Best YES bid/ask, "0.XXXX" probability. **Both can be null on illiquid markets.** |
| `noBid`, `noAsk` | string \| null | Best NO bid/ask. |
| `rulesPrimary` | string | Resolution rules. Render with `whitespace-pre-line`. |
| `rulesSecondary` | string \| null | Optional clarification. |
| `accounts` | object | Map of settlement mint → on-chain account info. **Not relevant for read-only browsing — leave alone.** |

## Common gotchas

1. **The response is wrapped** in `{ market: ... }`. The proxy passes it through unchanged, so the frontend `useMarket()` hook returns the wrapped shape. Access `data.market.yesBid`, not `data.yesBid`.
2. **Bid/ask are strings** like `"0.6100"`. Use `priceToFloat()` before comparing or arithmetic.
3. **`yesAsk` and `noBid` are not the same thing** even though they should sum to ~1. Use `yesAsk` for "what does it cost to buy YES" and `noBid` for "what does someone bid for NO". The orderbook endpoint only returns bids, but this endpoint exposes both as best-of fields.
4. **`closeTime` of 0** means open-ended (rare but possible). Pass through `closesIn()` in `lib/format.ts` which handles it.
5. **Don't fetch this on every market in the list** — the events endpoint already includes per-market bid/ask in the nested array. Only call this on the detail page.

## Example use

```ts
// Proxy route
import { dflow, handle } from '@/lib/dflow';

export async function GET(_req, { params }) {
  const { ticker } = await params;
  return handle(() => dflow(`/market/${encodeURIComponent(ticker)}`));
}
```

```tsx
// Frontend
const { data, isLoading } = useMarket(ticker);
const market = data?.market;

if (market?.status === 'settled' && market.result) {
  // show "Resolved YES" / "Resolved NO"
}
```

## Related

- [`orderbook.md`](./orderbook.md) — full bid ladder (this endpoint only gives best-of)
- [`candlesticks.md`](./candlesticks.md) — historical price chart
- [`trades.md`](./trades.md) — recent fills
