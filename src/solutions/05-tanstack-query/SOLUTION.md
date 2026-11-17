## Walkthrough

### graphql-request is just the fetcher

```ts
export const rickAndMorty = new GraphQLClient(RICK_AND_MORTY_API);

export async function fetchCharactersPage(page: number, filter: CharacterFilter) {
  const data = await rickAndMorty.request<{ characters: CharactersPage }>(CHARACTERS_PAGE_QUERY, { page, filter });
  return data.characters;
}
```

Keep fetchers plain async functions: they're trivially testable, reusable on the server (Server Components, route handlers) and independent of React.

### Keys describe *what* the data is

```ts
export const characterKeys = {
  all: ["rick-and-morty", "characters"] as const,
  list: (filter: CharacterFilter) => [...characterKeys.all, "list", filter] as const,
};
```

Every variable that changes the result must be in the key — otherwise two different lists overwrite each other. Hierarchy enables targeted invalidation: `invalidateQueries({ queryKey: characterKeys.all })` hits every list.

### Infinite queries

```ts
useInfiniteQuery({
  queryKey: characterKeys.list(filter),
  queryFn: ({ pageParam }) => fetchCharactersPage(pageParam, filter),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.info.next ?? undefined,
});
```

- `data.pages` is an array of page results; flatten it for rendering.
- `hasNextPage` is derived from `getNextPageParam` returning something other than `undefined`/`null`.
- `isPending` (no data yet) vs `isFetching` (any request in flight) vs `isFetchingNextPage` — show the right spinner.

### Prefetching

```ts
queryClient.prefetchInfiniteQuery({ queryKey: characterKeys.list(next), queryFn: …, initialPageParam: 1 });
```

Prefetch respects `staleTime`: hovering twice within 60 s doesn't refetch.

## TanStack Query vs Apollo for AEM

| | TanStack + graphql-request | Apollo |
| --- | --- | --- |
| Cache | per key (document-level) | normalized by `__typename` + key fields |
| Works with REST too | ✓ (AEM Sites/Assets OpenAPI, Adobe I/O) | GraphQL only |
| Persisted queries (GET `execute.json`) | trivial — it's just a `fetch` in the `queryFn` | needs a custom link |
| Bundle size | small | larger |

That's why "TanStack Query + a persisted-query fetcher" is a very common AEM headless stack.
