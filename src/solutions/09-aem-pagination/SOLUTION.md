## Walkthrough

### Offset: the "limit + 1" trick

```ts
const data = await aemQuery<AdventurePageData>(ADVENTURE_PAGE_QUERY, {
  offset: (page - 1) * pageSize,
  limit: pageSize + 1,
});
return { items: items.slice(0, pageSize), hasNextPage: items.length > pageSize, … };
```

AEM `…List` results don't include totals, so "Page 3 of 7" UIs need either a separate (expensive) count query that fetches all `_path`s, or a design without totals. "Previous / Next" works with one extra item.

Offset paging fits server-rendered pages with shareable URLs (`?page=3`) — good for SEO listing pages.

### Cursor: relayStylePagination

```ts
Query: { fields: { adventurePaginated: relayStylePagination(["_locale", "sort", "filter"]) } }
```

`relayStylePagination` is a field policy (keyArgs + merge + read) for exactly the `edges/node/pageInfo` shape AEM returns. `fetchMore({ variables: { after: endCursor } })`:

1. fetches the next page from the network,
2. merges the edges into the existing list (deduplicating by cursor),
3. re-renders the original `useQuery` with all edges.

> [!NOTE]
> A plain `client.query({ …, after })` with the default `cache-first` policy would be answered from the cache by the policy's `read` function — no request. `fetchMore` always goes to the network. (See the test in `lab.test.ts`.)

### Walking cursors on the server

```ts
let after: string | null = null;
do {
  const { edges, pageInfo } = (await aemQuery(…, { first: pageSize, after })).adventurePaginated;
  titles.push(...edges.map((edge) => edge.node.title));
  after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
} while (after);
```

Typical uses: `generateStaticParams` for *all* slugs, sitemaps, search-index exports. Prefer `first: 100` there (fewer round trips) and add a safety limit.

## Which one should you use?

- Listing page with page numbers / SEO URLs → **offset** (`List`).
- Infinite scroll, "load more", exports, anything large → **cursor** (`Paginated`).
