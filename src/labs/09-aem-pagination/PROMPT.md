## Goal

AEM offers two ways to page through fragments. You'll implement both and learn when to use which:

- **Part A — offset/limit** on `adventureList`, rendered on the server with `?page=` links.
- **Part B — cursors** on `adventurePaginated`, an infinite list in the browser using Apollo's `relayStylePagination`.

## Concepts and tooling

The examples use the **Location** model (`locationList` / `locationPaginated`); the tasks use **Adventure**. The mock has 16 adventures (so 4 pages of 5, the last one nearly empty) — a good size for spotting off-by-one mistakes.

### 1. Why paging looks different in AEM

Two facts shape everything in this lab:

1. AEM list results have **no total count** and no "has more" flag. You cannot render "page 2 of 4" from a list response alone.
2. Fetching *everything* in one request gets slow and heavy as the repository grows, and nothing in your UI needs 5,000 items at once.

So you page — and you decide up front *how* you'll know whether another page exists.

### 2. Offset paging: `offset` + `limit`

`…List` queries accept `offset` (how many items to skip) and `limit` (how many to return). Sorted by name, with 3 per page:

```graphql
query LocationsPage($offset: Int!, $limit: Int!) {
  locationList(_locale: "en", sort: "name ASC", offset: $offset, limit: $limit) {
    items { name }
  }
}
```

| Request | Result |
| --- | --- |
| `offset: 0, limit: 3` | Big Sur, Boulder Canyon, Chamonix-Mont-Blanc |
| `offset: 3, limit: 3` | El Chaltén, Jackson Hole, … |
| `offset: 100, limit: 3` | `items: []` — past the end is **not** an error |

For 1-based pages: `offset = (page - 1) * pageSize`.

**"Is there a next page?" — the `limit + 1` trick.** Since there's no total, ask for **one more item than you will show**. If the extra item comes back, a next page exists; throw it away before rendering:

```
pageSize = 3 → request limit = 4
  got 4 items  → show the first 3, hasNextPage = true
  got ≤ 3 items → show them all,    hasNextPage = false
```

> [!IMPORTANT]
> Always pass the **same `sort`** (and filter, locale) for every page. Paging without a sort orders by repository path, and a changing sort between pages makes items repeat or vanish. Large offsets also get slower — AEM must walk past everything it skips.

Strengths: you can jump to any page (`?page=7`) and each page is an ordinary, cacheable URL. Weakness: slow on big sets; items inserted while the user pages shift the boundaries.

### 3. Cursor paging: `first` + `after`

`…Paginated` queries return a **Relay-style connection** instead of a flat list:

```graphql
query LocationsConnection($first: Int!, $after: String) {
  locationPaginated(_locale: "en", sort: "name ASC", first: $first, after: $after) {
    edges {
      cursor            # a bookmark for THIS item
      node { name }     # the item itself
    }
    pageInfo {
      startCursor
      endCursor         # the bookmark to continue from
      hasNextPage       # ← the answer to "is there more?" — no limit+1 needed
      hasPreviousPage
    }
  }
}
```

```json
{ "locationPaginated": {
  "edges": [
    { "cursor": "eyJpIjowLCJwIjoiL2NvbnRlbnQvZGFtL…", "node": { "name": "Big Sur" } },
    { "cursor": "eyJpIjoxLCJwIjoiL2NvbnRlbnQvZGFtL…", "node": { "name": "Boulder Canyon" } }
  ],
  "pageInfo": { "startCursor": "eyJpIjow…", "endCursor": "eyJpIjox…", "hasNextPage": true, "hasPreviousPage": false }
} }
```

To get the next page, send the **previous page's `endCursor`** as `after`. Cursors are opaque — never parse or build them yourself.

| | `…List(offset, limit)` | `…Paginated(first, after)` |
| --- | --- | --- |
| Result | `{ items: [...] }` | `{ edges: [{ cursor, node }], pageInfo }` |
| Total count | **none** | none |
| "Is there more?" | ask for `limit + 1` | `pageInfo.hasNextPage` |
| Jump to page 7 | ✓ | ✗ (cursors are sequential) |
| Large sets | degrades with large offsets | stable — Adobe recommends it |
| Limits | — | `first` defaults to **50**, max **100** (`first: 101` is an error) |

### 4. Walking all pages on the server

Whenever you need *every* item (building a sitemap, `generateStaticParams`), loop on `hasNextPage`. The shape of the algorithm is always:

```
cursor = undefined; all = []
repeat
  page   = fetch(first = pageSize, after = cursor)
  all   += page.edges.map(e => e.node)
  cursor = page.pageInfo.endCursor
until page.pageInfo.hasNextPage is false
```

On the server you send the query with `aemQuery` from `@/lib/aem/client` (see [client.ts](../../lib/aem/client.ts)), which takes either a string or a parsed `DocumentNode` (what Apollo's `gql` produces) plus a variables object and returns `data`. Adobe's SDK ships this loop as an async generator, `runPaginatedQuery` (stretch goal).

### 5. Cursor paging in Apollo: `relayStylePagination`

In Lab 03 you hand-wrote a `merge` function so page 2 appended to page 1. For Relay-style connections Apollo already ships it:

```ts
import { relayStylePagination } from "@apollo/client/utilities";

const typePolicies = {
  Query: {
    fields: {
      locationPaginated: relayStylePagination(["_locale", "sort", "filter"]),
    },
  },
};
```

- The argument is **`keyArgs`**: the arguments that identify a *different list* — everything except `first`/`after`/`before`/`last`. Change the filter and you get a separate list; change `after` and you extend the same one.
- It merges new `edges` using the cursors, keeps `pageInfo` up to date and de-duplicates.
- It needs the standard fields in your selection: `edges { cursor node { … } }` and `pageInfo { startCursor endCursor hasNextPage hasPreviousPage }`.
- Because the policy *reads* from the cache, `fetchMore` is how you fetch the next page: `fetchMore({ variables: { after: endCursor } })`. You pass only what changes.

As in Lab 08, identify AEM fragments by `_path` — here for the item type the connection contains: `LocationModel: { keyFields: ["_path"] }`.

## Data shapes

### Part A: `adventureList(_locale: "en", sort: "title ASC", offset: 0, limit: 6)`

```json
{
  "data": {
    "adventureList": {
      "items": [
        { "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp", "title": "Bali Surf Camp", "activity": "Surfing", "price": 1890, "primaryImage": { "_dynamicUrl": "/adobe/…" } },
        "… 6 items (5 shown + 1 to detect the next page)"
      ]
    }
  }
}
```

### Part B: `adventurePaginated(_locale: "en", sort: "title ASC", first: 5)`

```json
{
  "data": {
    "adventurePaginated": {
      "edges": [
        { "cursor": "eyJpIjowLCJwIjoiL2NvbnRlbnQvZGFtL…", "node": { "_path": "…/bali-surf-camp", "title": "Bali Surf Camp", "…": "…" } }
      ],
      "pageInfo": {
        "startCursor": "eyJpIjowLCJwIjoi…",
        "endCursor": "eyJpIjo0LCJwIjoi…",
        "hasNextPage": true,
        "hasPreviousPage": false
      }
    }
  }
}
```

The row type is `AdventureRow` in [types.ts](./types.ts): `_path title activity price primaryImage`.

## Your tasks

### Part A — offset · [offset.ts](./offset.ts)

**Task 1 — `ADVENTURE_PAGE_QUERY`.** `query AdventurePage($offset: Int!, $limit: Int!)` selecting from `adventureList(_locale: "en", sort: "title ASC", offset: $offset, limit: $limit)`, inside `items`: `_path title activity price` and `primaryImage { ... on ImageRef { _dynamicUrl } }`.

**Task 2 — `getAdventurePage(page, pageSize)`** (1-based `page`):

1. `offset = (page - 1) * pageSize`; `limit = pageSize + 1`.
2. Call `aemQuery<AdventurePageData>(ADVENTURE_PAGE_QUERY, { offset, limit })`.
3. Return `{ items: items.slice(0, pageSize), page, pageSize, hasNextPage: items.length > pageSize }`.

**Works when** (with 16 adventures, `pageSize = 5`):

| Call | `items.length` | `hasNextPage` |
| --- | --- | --- |
| `getAdventurePage(1, 5)` | 5 (first: Bali Surf Camp) | `true` |
| `getAdventurePage(3, 5)` | 5 | `true` |
| `getAdventurePage(4, 5)` | 1 (Yosemite Backpacking) | `false` |

### Part B — cursor · [cursor.ts](./cursor.ts), [InfiniteAdventures.tsx](./InfiniteAdventures.tsx)

**Task 3 — `ADVENTURES_CONNECTION_QUERY`.**

```graphql
query AdventuresConnection($first: Int!, $after: String) {
  adventurePaginated(_locale: "en", sort: "title ASC", first: $first, after: $after) {
    edges { cursor node { _path title activity price primaryImage { … on ImageRef { _dynamicUrl } } } }
    pageInfo { startCursor endCursor hasNextPage hasPreviousPage }
  }
}
```

(Write the real inline fragment `... on ImageRef` where the sketch shows `…`.) Keep the `TypedDocumentNode` annotation.

**Task 4 — `paginationTypePolicies`.** Two entries (concept 5): `Query.fields.adventurePaginated: relayStylePagination(["_locale", "sort", "filter"])` and `AdventureModel: { keyFields: ["_path"] }`. `relayStylePagination` comes from `@apollo/client/utilities`.

**Task 5 — `fetchAllAdventureTitles(pageSize)`.** Implement the loop from concept 4 with `aemQuery<AdventuresConnectionData>(ADVENTURES_CONNECTION_QUERY, { first: pageSize, after: cursor })` and return the `title` of every node, in order. Guard against an infinite loop: stop if `hasNextPage` is true but `endCursor` is `null`.

**Works when:** `fetchAllAdventureTitles(5)` returns 16 unique titles, first *Bali Surf Camp*, last *Yosemite Backpacking*.

**Task 6 — the hook.** In `InfiniteAdventures`, replace the `todo(...)` with `useQuery(ADVENTURES_CONNECTION_QUERY, { variables: { first: 5 }, notifyOnNetworkStatusChange: true })` (`useQuery` as a value from `@apollo/client/react`).

**Task 7 — `loadMore`.** `fetchMore({ variables: { after: connection.pageInfo.endCursor } })`, only when `connection?.pageInfo.hasNextPage` is true.

## Acceptance criteria

- `npm test -- 09` passes.
- Part A pages through 4 pages (16 adventures) and hides "Next" on the last one.
- Part B appends 5 at a time until "hasNextPage: false".

## Stretch goals

- Replace the button with infinite scroll: an `IntersectionObserver` on a sentinel `<div>` that calls `loadMore`.
- Pass a `filter` variable to the connection and check the cache keeps a separate list per filter (that's what `keyArgs` is for).
- Request `first: 101` and read the error.
- Use `runPaginatedQuery` from `@adobe/aem-headless-client-js` (Lab 11) — it's an async generator over the same cursors.
