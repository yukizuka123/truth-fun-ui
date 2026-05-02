# `GET /tags_by_categories`

Returns the canonical map of categories to their tags. Used to populate filter UI.

## Used by

- `app/api/filters/route.ts`
- Frontend: `FilterBar` component (currently hardcodes the 4 main categories, but can use this for full lists or sub-tag filtering); `useFilters()` hook.

## Full URL

```
GET {BASE}/api/v1/tags_by_categories
```

## Query parameters

None.

## Response shape

```json
{
  "tagsByCategories": {
    "Sports": ["Football", "Soccer", "Basketball", "Baseball", "Hockey", ...],
    "Crypto": ["Bitcoin", "Ethereum", "Solana", "BTC", "ETH", ...],
    "Politics": ["Election", "President", "Congress", ...],
    "News": ["Tech", "Economy", "Climate", ...],
    "Economics": ["GDP", "Inflation", "Fed", ...],
    "Entertainment": [...],
    "Climate": [...],
    "Science": [...]
  }
}
```

The exact list of categories and tags is dynamic — DFlow adds new ones as Kalshi expands market coverage. Don't hardcode the full list of categories anywhere except as defaults in `FilterBar`.

## Common gotchas

1. **Categories beyond the 4 in our spec exist.** The PRD asks for Sports / News / Politics / Crypto + a "Completed" status filter. The endpoint returns more categories. Either show all of them or filter to those 4 in the FilterBar component.
2. **Tags are not per-event filters in our app.** We use category-level filtering only (`?category=Sports` on the events endpoint). Tags would be a sub-filter; out of hackathon scope.
3. **Cache for an hour.** This data barely changes. `useFilters()` has `staleTime: 60 * 60_000`.
4. **The category names are exact strings used in `/events?category=`.** Don't lowercase or modify before passing through.

## Example use in FilterBar

```tsx
// Current: hardcoded list
const CATEGORIES = ['Sports', 'News', 'Politics', 'Crypto'];

// Optional upgrade: use the actual endpoint
const { data } = useFilters();
const categories = Object.keys(data?.tagsByCategories ?? {});
```

The hardcoded list is fine for the hackathon. Use the live data only if you want to show every category DFlow supports.

## Related

- [`events.md`](./events.md) — the events endpoint accepts `category` and `tags` query params using the values from this response.
