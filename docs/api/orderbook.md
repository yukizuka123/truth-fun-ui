# `GET /orderbook/{ticker}`

Current orderbook for a market. Returns YES bid ladder and NO bid ladder (no asks — see "The bid-only model" below).

## Used by

- `app/api/markets/[ticker]/orderbook/route.ts`
- Frontend: `useOrderbook()` polls every **3 seconds** for live-feel.

## Full URL

```
GET {BASE}/api/v1/orderbook/{market_ticker}
```

## Query parameters

None.

## Response shape

```json
{
  "sequence": 4169465,
  "yes_bids": {
    "0.6100": 5000,
    "0.6000": 12000,
    "0.5900": 3500
  },
  "no_bids": {
    "0.3700": 3000,
    "0.3600": 8500,
    "0.3500": 15000
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `sequence` | int | Monotonic counter. Useful for diff-detection if we ever go WebSocket. Ignore for now. |
| `yes_bids` | object | Map of price string → size integer. Bids ON the YES side (buyers willing to pay X for YES). |
| `no_bids` | object | Map of price string → size integer. Bids ON the NO side. |

`yes_bids` or `no_bids` may be **`{}`** — empty object, not undefined. Common on thin markets, this is normal.

## The bid-only model — read this carefully

DFlow's orderbook (and Kalshi's underlying model) does not have separate bid and ask ladders. Instead:

- A **YES bid at 0.61** means: "someone is willing to pay 61¢ for a YES contract."
- The **YES ask** (cost to buy YES) is implicit: it's `1 - bestNoBid`. If the best NO bid is 0.37, then someone bought NO at 37¢, which means selling YES at 63¢. So YES ask = 0.63.
- **YES bid ladder** = buyers of YES; orderbook shows their prices/sizes.
- **NO bid ladder** = buyers of NO; orderbook shows their prices/sizes.

**Implication for UI:** show two side-by-side bid ladders, one labeled "YES bids" and one "NO bids". Don't try to construct a unified bid/ask table — it will be confusing because the ask side is a function of the other ladder. `OrderbookLadder.tsx` does this correctly out of the box.

If you really want best-bid/best-ask numbers, use the `yesBid`, `yesAsk`, `noBid`, `noAsk` fields on the **market** endpoint response — DFlow computes the asks for you there.

## Common gotchas

1. **Empty `{}` is valid.** Show "No bids on this side" — don't show an error or skeleton forever.
2. **Prices are strings.** Sort with `parseFloat()`, not string comparison. `"0.6100" > "0.59"` is false because `'1'` < `'9'` lexically.
3. **Sizes are sometimes huge integers** — display with `.toLocaleString()` to insert commas. Don't render `2892941` as-is.
4. **The 3s poll interval** is fine for demo but burns request quota in production. If you switch to prod and hit limits, dial it back to 5s.
5. **Stale data while polling** — React Query keeps the previous orderbook visible during refetch. This means the ladder won't blank out; it just updates in place. Don't add manual loading states inside the ladder — only on initial load.

## Maintenance window caveat

Thursdays 3–5 AM ET, the orderbook may look frozen because Kalshi's clearinghouse is offline. Don't treat as a bug.

## Example

```ts
// Proxy route
export async function GET(_req, { params }) {
  const { ticker } = await params;
  return handle(() => dflow(`/orderbook/${encodeURIComponent(ticker)}`));
}
```

```tsx
// Component (simplified)
const { data, isLoading } = useOrderbook(ticker);

const yesBids = Object.entries(data?.yes_bids ?? {})
  .map(([p, s]) => [parseFloat(p), s as number])
  .sort((a, b) => b[0] - a[0])  // best bid first
  .slice(0, 8);
```

## Related

- [`market.md`](./market.md) — exposes pre-computed best `yesBid`/`yesAsk`/`noBid`/`noAsk`. Use this instead if you only need top-of-book.
- [`trades.md`](./trades.md) — actual executions, not standing offers.
