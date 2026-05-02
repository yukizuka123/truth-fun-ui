# `GET /search`

Multi-field full-text search across events and markets.

## Used by

- `app/api/search/route.ts`
- Frontend: `SearchBox` component; `useSearch(q)` hook with 250ms debounce.

## Full URL

```
GET {BASE}/api/v1/search?q={query}
```

## Query parameters

| Param | Type | Notes |
|---|---|---|
| `q` | string | The search query. Tokenized on whitespace; **all tokens must match**. |

## What gets searched

**Events:** `id` (event ticker), `series_ticker`, `title`, `subtitle`.
**Markets:** `id` (market ticker), `event_ticker`, `title`, `yes_sub_title`, `no_sub_title`.

**Not searched:** tags, categories, rules, settlement source, image URLs, competition fields. So you can't search "Sports" — for category filtering, use the events endpoint with `category=Sports`.

## Matching rules

- **Tokens are AND'd.** `"tech layoffs"` requires both "tech" AND "layoffs" to appear. Order doesn't matter.
- **Tickers are case-insensitive.** `kxbtc` matches `KXBTC`.
- **Text fields use full-text matching** with stemming (so "layoff" matches "layoffs").
- **Special characters are escaped.** Apostrophes, ampersands etc. are safe to pass through.

## Response shape

```json
{
  "events": [
    {
      "ticker": "KXLAYOFFS-26",
      "title": "Tech layoffs in 2026",
      "subtitle": "Will more tech workers be laid off in 2026 than 2025?",
      "category": "News",
      "markets": [
        {
          "ticker": "KXLAYOFFSYINFO-26",
          "title": "More tech layoffs in 2026 than in 2025?",
          "status": "active",
          ...
        }
      ]
    }
  ],
  "markets": [
    {
      "ticker": "KXLAYOFFSYINFO-26",
      "eventTicker": "KXLAYOFFS-26",
      "title": "More tech layoffs in 2026 than in 2025?",
      "status": "active",
      ...
    }
  ]
}
```

The proxy at `/api/search` filters `events` to only binary ones (`event.markets.length === 1`) and passes through `markets` as-is. The `SearchBox` component primarily uses `events` for results; `markets` is there if needed but usually duplicates the event data.

## Common gotchas

1. **Empty query** returns either 400 or empty arrays — varies. Proxy short-circuits if `q.length < 2` to avoid this.
2. **Case-insensitive on tickers but not on text.** `"BITCOIN"` matches "bitcoin" the ticker but you might miss case-sensitive title hits in some edge cases. In practice the search is forgiving.
3. **No category filter via search.** Don't try `/search?q=foo&category=Sports`. To browse a category, use the events endpoint.
4. **Result count can be large.** No `limit` param documented; if results blow up, slice client-side or in the proxy.
5. **Multi-outcome events leak in** before our proxy filter. After filtering, an apparently relevant search may return zero events because all hits were multi-outcome. UI handles this with "No results for «query»".

## Debounce, don't throttle

`SearchBox` uses 250ms debounce, not throttle. Throttle would fire mid-typing. Debounce waits until typing stops.

```ts
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
```

Pair with `enabled: q.length >= 2` in the React Query hook to skip too-short queries.

## Caching

Search has a long staleTime (5 min) because the same query yields the same results for a while, and people often search → click away → search the same thing again. React Query serves the second call from cache.

## Example

```ts
// Proxy route
export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get('q')?.trim();
    if (!q || q.length < 2) return { events: [], markets: [] };

    const data = await dflow('/search', { q });
    return {
      events: (data.events ?? []).filter(isBinaryEvent),
      markets: data.markets ?? [],
    };
  });
}
```

```tsx
// Hook usage
const { data, isLoading } = useSearch(debouncedInput);
const events = data?.events ?? [];
```

## Related

- For browsing by category/tag instead of free-text, use `/events` with `category=`/`tags=`.
- [`tags.md`](./tags.md) — populate the category filter UI.
