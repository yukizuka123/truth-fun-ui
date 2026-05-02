# DFlow Metadata API Reference (for this project)

These docs describe the exact upstream DFlow endpoints used by the proxy in `app/api/*`. They are the canonical reference for this codebase. **When a route's behavior is unclear, read the doc here before changing code.**

## Why these docs exist

The project's proxy (`lib/dflow.ts`) talks to DFlow's Metadata API. Claude Code does not have live access to the DFlow MCP server during execution, so we inline the relevant API specs here. These docs cover what the proxy actually consumes — not the full DFlow surface area.

## Base URLs

| Env | URL | Auth |
|---|---|---|
| Dev | `https://dev-prediction-markets-api.dflow.net` | None |
| Prod | `https://prediction-markets-api.dflow.net` | `x-api-key` header |

All paths below prefix with `/api/v1`.

## Endpoint index

| File | DFlow path | Used by |
|---|---|---|
| [`events.md`](./events.md) | `GET /events` | `/api/dashboard`, `/api/markets` |
| [`market.md`](./market.md) | `GET /market/{ticker}` | `/api/markets/[ticker]` |
| [`candlesticks.md`](./candlesticks.md) | `GET /market/{ticker}/candlesticks` | `/api/markets/[ticker]/candles` |
| [`orderbook.md`](./orderbook.md) | `GET /orderbook/{ticker}` | `/api/markets/[ticker]/orderbook` |
| [`trades.md`](./trades.md) | `GET /onchain-trades/by-market/{ticker}` | `/api/markets/[ticker]/trades` |
| [`search.md`](./search.md) | `GET /search` | `/api/search` |
| [`tags.md`](./tags.md) | `GET /tags_by_categories` | `/api/filters` |

## Cross-cutting facts

These apply to every endpoint and matter for the whole proxy:

1. **No CORS headers** — that's why the proxy exists. Never call these URLs from the browser.
2. **Prices** are 4-decimal probability strings (`"0.6100"`) on orderbooks and bid/ask fields. They're integers on the 0–10000 scale on trade objects (`price: 6200` = 62¢). Some trade fields also expose `*PriceDollars` strings (`"0.62"`). Always normalize to 0–1 floats via `priceToFloat()` in `lib/format.ts` before display.
3. **Tickers** are case-insensitive on most endpoints but always uppercase in canonical responses. Pass them through as-is from upstream — don't lowercase.
4. **Timestamps** are Unix seconds (not milliseconds). Multiply by 1000 before passing to JS `Date`.
5. **Nullable fields** are everywhere — `volume24h`, `subtitle`, `imageUrl`, `yesBid`, `noBid`, `result`, etc. Frontend must coalesce.
6. **`isInitialized=true`** filter, when passed, hides markets that haven't been traded through DFlow yet — which is most of them. **Never pass this flag for listing/discovery.** Only useful when checking if a specific market is tokenized before trading, which we don't do in this app.
7. **Status values** — common ones: `active`, `initialized`, `settled`, `closed`, `expired`. Check the lifecycle FAQ before adding new values.
8. **Categories** — top-level event grouping: `Sports`, `News`, `Politics`, `Crypto`, plus others (`Economics`, `Entertainment`, `Climate`, `Science`, etc.). Get the full live list from `/tags_by_categories`.
