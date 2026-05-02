# `GET /onchain-trades/by-market/{ticker}`

Recent fills (executed trades) on a single market. Returns trades that hit the chain via DFlow.

## Used by

- `app/api/markets/[ticker]/trades/route.ts`
- Frontend: `TradeFeed` component; `useTrades(ticker)` polls every 5 seconds.

## Full URL

```
GET {BASE}/api/v1/onchain-trades/by-market/{market_ticker}?{params}
```

## Query parameters

| Param | Type | Notes |
|---|---|---|
| `limit` | int | Max trades to return. Default 50, cap typically 100. |
| `cursor` | string | Pagination cursor from previous response. |
| `sortBy` | `"createdAt"` | Sort field. Use `createdAt` for time-ordered feed. |
| `sortOrder` | `"asc"` \| `"desc"` | `desc` = newest first. Use this. |
| `minAmount` | int | Optional. Filter to trades above a size threshold (useful for whale alerts; not used in this app). |

## Response shape

```json
{
  "trades": [
    {
      "tradeId": "trade_abc123",
      "ticker": "KXLAYOFFSYINFO-26",
      "marketTicker": "KXLAYOFFSYINFO-26",
      "price": 6200,
      "count": 500,
      "yesPrice": 6200,
      "noPrice": 3800,
      "yesPriceDollars": "0.62",
      "noPriceDollars": "0.38",
      "takerSide": "YES",
      "createdTime": 1746086400,
      "createdAt": 1746086400,
      "wallet": "XJfdwG...",
      "transactionSignature": "5KzN...",
      "inputAmount": 500,
      "outputAmount": 806
    }
  ],
  "cursor": "eyJjcmVhdGVkQXQiOjE3NDYwODY0MDAsImlkIjoidHJhZGVfYWJjMTIzIn0=",
  "hasMore": true
}
```

| Field | Type | Notes |
|---|---|---|
| `tradeId` / `id` | string | Unique trade ID. Use as React key. |
| `ticker` / `marketTicker` | string | Market this trade belongs to. |
| `price` | int | YES price on **0–10000 scale**. `6200` = 62¢. |
| `count` | int | Number of contracts. |
| `yesPrice`, `noPrice` | int | 0–10000 scale, sum to ~10000. |
| `yesPriceDollars`, `noPriceDollars` | string | Same prices as readable strings ("0.62"). **Use these for display** — saves a normalization step. |
| `takerSide` | string | `"YES"` or `"NO"` (case may vary). The side the taker bought. |
| `createdTime` / `createdAt` | int (Unix sec) | Trade timestamp. |
| `wallet` | string | Trader wallet address. Truncate for display (`XJfd…wG`). |
| `transactionSignature` | string | On-chain Solana tx signature. Could link out to Solscan, but for hackathon we just ignore. |

## Common gotchas

1. **Prices come in two formats** — integer `6200` and string `"0.62"`. The string version is easier; use it. The `priceToFloat()` helper handles both.
2. **`takerSide` casing varies.** Be defensive: `t.takerSide === 'YES' || t.takerSide === 'yes'`.
3. **Empty trades array** — valid for new markets. Show "No trades yet."
4. **Don't paginate trades on the detail page.** Show last 10–20 most recent only. Pagination is wasted complexity for a hackathon market view.
5. **5s poll interval** — fine for demo. If users see the same trade repeatedly, that's expected (it's the latest one until a new fill comes in).
6. **Trades from this endpoint include both onchain DFlow trades and offchain Kalshi trades** (per the FAQ). So a market can show activity even if no one has traded through DFlow specifically.

## Display pattern

```tsx
<li className="flex items-center justify-between">
  <span className={isBuy ? 'text-emerald-700' : 'text-rose-700'}>
    {isBuy ? 'Buy YES' : 'Buy NO'}
  </span>
  <span>{count.toLocaleString()} @ {cents(priceFloat)}</span>
  <span className="text-xs text-neutral-400">{timeAgo(createdTime)}</span>
</li>
```

The `TradeFeed` component already implements this.

## Related

- [`orderbook.md`](./orderbook.md) — standing offers vs. these (executed fills).
- [`candlesticks.md`](./candlesticks.md) — aggregate version of this data.
