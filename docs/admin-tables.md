# Admin tables: the protocol

Every admin list (players, audit log, reports, awards, …) follows these rules, so
admins learn one table and every new one is cheap to build.

## 1. The URL is the state

`/admin/players?status=guest,unverified&role=user&joined_from=2026-10-01&sort=joined&dir=asc&q=kai`

| Param | Meaning |
|---|---|
| `q` | Free-text search across the table's search fields |
| `<column>` | Text filter (contains) or enum filter (comma list, any of) |
| `<column>_from`, `<column>_to` | Date range, `YYYY-MM-DD`, inclusive, Bangkok time |
| `sort`, `dir` | Sorted column and `asc` / `desc`; absent = the table's default order |

Unknown params and values are dropped by `readTable` (`src/lib/table-query.ts`)
before they reach the database. Any view can be bookmarked, shared or linked to
from a dashboard number. Paging is not in the URL (infinite scroll).

## 2. Columns declare what they can do

```ts
const COLUMNS: Column[] = [
  { key: "player", label: "Player", sort: true, filter: "text" },
  { key: "status", label: "Status", sort: true, filter: "enum", options: [{ value: "guest", label: "Guest" }] },
  { key: "joined", label: "Joined", sort: true, filter: "date" },
];
```

- **Sort:** clicking a header (`SortHeader`) cycles off → ▲ ascending → ▼ descending → off. One sorted column at a time; off means the table's default order.
- **Filter:** one **Filter** button (`FilterPanel`) opens a panel with every filterable column: a "contains" box for text, tick boxes for enums, from–to for dates. Fill only what you need, then Apply. The button shows how many filters are on.

Both are plain links / GET forms (`src/components/data-table.tsx`), so they work without JavaScript.

## 3. Above the table

`Filter · count · active filter chips (each with ×) · Clear all ············ Export CSV`

Export CSV downloads exactly the current view (same params), all rows.

## 4. Every value is a link

- The row's name → its detail page.
- An enum value (badge) → the same table filtered to that value.
- A text value (e.g. a Minecraft name) → filtered to that value.
- A date → filtered to that day.
- A count anywhere in admin (dashboard tile, card badge) → the table view behind it.

## 5. One RPC per table

`admin_list_<thing>(p_filters jsonb, p_query text, p_sort text, p_desc boolean, p_offset int, p_limit int)`

- Security definer, `search_path = ''`, first line `FORBIDDEN` unless the caller's role may read it.
- Rejects unknown filter keys, enum values and sort keys with `INVALID`.
- Returns the rows plus `total` (`count(*) over ()`), ordered with `id` as the last tie-breaker.
- Escape `%`, `_` and `\` before `ilike`.
- pgTAP test per filter kind, the role check, and the escape.

## 6. States

Loading skeleton · empty ("No matches" + Clear filters) · error with retry ·
"All N loaded" at the end of the scroll.
