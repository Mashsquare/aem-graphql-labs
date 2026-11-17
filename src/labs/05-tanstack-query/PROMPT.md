## Goal

Many teams don't use a "GraphQL client" at all. They combine **TanStack Query** (the most popular async-state library in React, ≈280M downloads/month) with a tiny GraphQL fetcher such as **graphql-request**. TanStack handles caching, deduplication, retries and pagination; graphql-request just turns a document + variables into a typed promise. You'll see this pairing in AEM projects that mostly fetch persisted queries.

By the end you will have a fetcher, a query-key factory, an infinite "Load more" gallery and hover-prefetching — and you'll know which library is responsible for which part.

## Concepts and tooling

### 1. Two libraries, two responsibilities

```
 React component
      │  useInfiniteQuery({ queryKey, queryFn })      ← TanStack Query: WHEN to fetch, caching, retries, paging state
      ▼
   queryFn  ──▶  client.request(DOCUMENT, variables)  ← graphql-request: HOW to talk to the server
      ▼
   GraphQL API
```

TanStack Query knows nothing about GraphQL: it caches *whatever promise your `queryFn` returns*. graphql-request knows nothing about React or caching: it sends one request. That separation is why you can swap either half (for example the AEM headless SDK from Lab 11 as the fetcher).

> [!NOTE]
> There is **no normalization**: TanStack caches each query result as a whole, keyed by the **query key** (like urql's document cache, unlike Apollo). The upside is that nothing about your schema has to follow conventions — which suits AEM, where objects have no `id`.

### 2. graphql-request

```ts
import { ClientError, GraphQLClient, gql } from "graphql-request";

// One instance, reused. Headers, URL and fetch options live here.
const countries = new GraphQLClient("https://countries.trevorblades.com/graphql");

const COUNTRY = gql`
  query Country($code: ID!) {
    country(code: $code) { name capital }
  }
`;

const data = await countries.request<{ country: { name: string; capital: string | null } | null }>(COUNTRY, { code: "BR" });
data.country?.name; // "Brazil"
```

- `gql` is just a tag that returns the string (it exists so editors highlight GraphQL).
- `request<TData>(document, variables)` **resolves with `data`** only — no `{ data, errors }` envelope to unwrap.
- It **throws** a `ClientError` when the server returns GraphQL `errors` *or* a non-2xx status. A `ClientError` carries the full response:

```ts
try {
  await countries.request(`{ nope }`);
} catch (error) {
  if (error instanceof ClientError) {
    error.response.status;                              // the HTTP status — many servers (AEM too) use 200 even here
    error.response.errors?.map((e) => e.message);       // ['Cannot query field "nope" on type "Query".']
  }
}
```

So "was it a GraphQL error or an HTTP error?" is answered by `error.response.errors` being present or not.

### 3. Query keys: the cache identity

In TanStack Query every cache entry is addressed by a **query key** — an array, hashed deterministically (object key order doesn't matter):

```ts
["rick-and-morty", "characters", "list", { status: "dead" }]
```

Same key → same cache entry → shared by every component that uses it. Different key → different entry. Everything that changes the *result* must be in the key (filters, page size, locale…); the page number of an infinite query is *not*, because the pages live **inside** one entry.

A **key factory** keeps keys consistent and makes invalidation precise, because TanStack matches keys by *prefix*:

```ts
const countryKeys = {
  all: ["countries"] as const,
  list: (continent: string) => [...countryKeys.all, "list", continent] as const,
  detail: (code: string) => [...countryKeys.all, "detail", code] as const,
};

queryClient.invalidateQueries({ queryKey: countryKeys.all });                  // every country query
queryClient.invalidateQueries({ queryKey: countryKeys.list("EU") });           // just one list
```

### 4. `useQuery` basics and `staleTime`

```ts
const { data, isPending, isError, error, isFetching } = useQuery({
  queryKey: countryKeys.detail(code),
  queryFn: () => countries.request<CountryData>(COUNTRY, { code }),
});
```

| Flag | Meaning |
| --- | --- |
| `isPending` | no data yet (first load) |
| `isFetching` | a request is running — true during background refreshes too |
| `isStale` | the data is older than `staleTime` |

**`staleTime`** (default `0`) is how long cached data counts as *fresh*. Fresh data is served with no request. Stale data is *still shown instantly* but refetched in the background when a component mounts. The lab's [CharacterGallery.tsx](./CharacterGallery.tsx) provider sets `staleTime: 60_000` — that's why switching back to a filter you already visited is instant.

### 5. `useInfiniteQuery`: pages inside one cache entry

Offset-style paging ("page 1, 2, 3…") maps onto an **infinite query**. A worked example for the Rick and Morty `locations` list:

```ts
const query = useInfiniteQuery({
  queryKey: ["locations"],
  queryFn: ({ pageParam }) => request<LocationsData>(LOCATIONS, { page: pageParam }).then((d) => d.locations),
  initialPageParam: 1,                                           // the pageParam of the FIRST fetch
  getNextPageParam: (lastPage) => lastPage.info.next ?? undefined, // the pageParam of the NEXT fetch…
});                                                              // …or `undefined` = "no more pages"

query.data?.pages;           // [ page1, page2, … ]  — an array of whatever queryFn returned
query.fetchNextPage();       // fetch with pageParam = getNextPageParam(lastPage)
query.hasNextPage;           // false once getNextPageParam returned undefined
query.isFetchingNextPage;    // true during fetchNextPage

const all = query.data?.pages.flatMap((page) => page.results) ?? [];
```

Two details that trip people up: `getNextPageParam` must return **`undefined`** (not `null`) to stop — hence `?? undefined` for the API's `next: null`; and `initialPageParam` is required in v5.

### 6. `QueryClient`, the provider and `useQueryClient`

The `QueryClient` *is* the cache. [CharacterGallery.tsx](./CharacterGallery.tsx) already creates one with `useState(() => new QueryClient(...))` (once per mount — same reasoning as urql's client) and wraps the tree in `QueryClientProvider`. Components reach it with the hook:

```ts
const queryClient = useQueryClient();   // a hook: call it at the top level of the component, never inside an event handler
```

### 7. Prefetching

`queryClient.prefetchInfiniteQuery({ queryKey, queryFn, initialPageParam })` fills the cache **without** rendering anything. Call it when the user *signals intent* (hovering a button) and the click that follows finds data waiting. Prefetching respects `staleTime`: if the entry is still fresh nothing is requested.

```ts
const onHover = () => queryClient.prefetchQuery({ queryKey: countryKeys.detail("BR"), queryFn: () => fetchCountry("BR") });
```

> [!TIP]
> Add `@tanstack/react-query-devtools` (`<ReactQueryDevtools />` inside the provider) to watch keys, fresh/stale status and pages live.

## The API

**Rick and Morty API**, `characters(page: Int, filter: FilterCharacter)` — 20 per page.

### Data shape: `characters(page: 1, filter: { status: "dead" })`

```json
{
  "data": {
    "characters": {
      "info": { "count": 287, "pages": 15, "next": 2 },
      "results": [
        { "id": "8", "name": "Adjudicator Rick", "status": "Dead", "species": "Human", "image": "https://rickandmortyapi.com/api/character/avatar/8.jpeg" }
      ]
    }
  }
}
```

(Counts change occasionally — the shape doesn't.) `filter: {}` (no status) returns all characters. `info.next` is `null` on the last page.

## Your tasks

Everything in [api.ts](./api.ts) first (tasks 1–3, covered by `npm test -- 05`), then the component.

### Task 1 — document and fetcher · [api.ts](./api.ts) → `CHARACTERS_PAGE_QUERY`, `fetchCharactersPage`

1. Replace the placeholder document:

   ```graphql
   query CharactersPage($page: Int!, $filter: FilterCharacter) {
     characters(page: $page, filter: $filter) {
       info { count pages next }
       results { id name status species image }
     }
   }
   ```

2. `fetchCharactersPage(page, filter)`: call `rickAndMorty.request<{ characters: CharactersPage }>(CHARACTERS_PAGE_QUERY, { page, filter })` and **return `data.characters`** (the page, not the envelope).

**Works when:** the test "fetches a filtered page" passes — 20 results, all `Dead`, `info.next === 2`.

### Task 2 — keys and the paging rule · [api.ts](./api.ts) → `characterKeys.list`, `getNextPageParam`

- `characterKeys.list(filter)` returns `[...characterKeys.all, "list", filter]`. Resulting key for `{ status: "dead" }`: `["rick-and-morty", "characters", "list", { status: "dead" }]`.
- `getNextPageParam(lastPage)` returns `lastPage.info.next` as a number, or **`undefined`** when it is `null`.

**Works when:** "builds hierarchical keys" and "returns the next page or undefined" pass.

### Task 3 — readable errors · [api.ts](./api.ts) → `describeError`

Input `unknown`, output `string`:

| Input | Output |
| --- | --- |
| `ClientError` with `response.errors` | all `errors[].message` joined with `"; "` |
| `ClientError` without GraphQL errors (e.g. a 502) | `` `HTTP ${error.response.status}` `` |
| any other `Error` | `error.message` |
| anything else | `String(error)` |

(Section 2 shows where the fields live.)

**Works when:** "turns a ClientError into readable messages" passes.

### Task 4 — the infinite query · [CharacterGallery.tsx](./CharacterGallery.tsx) → `CharacterGallery`

Replace the `todo(...)` with section 5's pattern:

```ts
const query = useInfiniteQuery({
  queryKey: characterKeys.list(filter),
  queryFn: ({ pageParam }) => fetchCharactersPage(pageParam, filter),
  initialPageParam: 1,
  getNextPageParam,
});
```

Import `useInfiniteQuery` from `@tanstack/react-query`, and `characterKeys`, `fetchCharactersPage`, `getNextPageParam` from `./api`. Delete the `as UseInfiniteQueryResult<…>` cast.

**Works when:** the first 20 characters load; "Load more" adds 20 more; switching to *dead* and back to *all* is instant.

### Task 5 — prefetch on hover · [CharacterGallery.tsx](./CharacterGallery.tsx) → `prefetch(status)`

1. At the **top** of `CharacterGallery`, next to the other hooks, add `const queryClient = useQueryClient();`.
2. In `prefetch`, call `queryClient.prefetchInfiniteQuery({ queryKey: characterKeys.list(...), queryFn: ..., initialPageParam: 1 })`. The filter is `status ? { status } : {}` — build it **once** and use it for both the key and the `queryFn`, otherwise you prefetch into a different cache entry than the one the click reads.

**Works when:** hovering *dead* triggers a request in DevTools → Network *before* you click, and the click renders instantly.

## Acceptance criteria

- `npm test -- 05` passes.
- "Load more" appends pages; switching filters keeps each filter's pages (switch back: instant, no request — the data is still fresh for 60 s).
- Hovering a filter button fires a request *before* you click (DevTools → Network).

## Stretch goals

- Invalidate everything for this feature with `queryClient.invalidateQueries({ queryKey: characterKeys.all })` from a button.
- Replace the hand-written `CharactersPage` type with a Codegen-generated `TypedDocumentNode` (Lab 06) — graphql-request infers the result type from it.
- Use `select` on the query to flatten `pages` into one array inside TanStack instead of the component.
