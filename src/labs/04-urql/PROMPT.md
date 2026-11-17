## Goal

**urql** is a smaller, more explicit alternative to Apollo (≈5M downloads/month, used heavily by teams that want predictable caching). Its whole architecture is visible in one line — `exchanges: [cacheExchange, fetchExchange]` — which makes it a great way to understand what a GraphQL client *is*: a pipeline of operations and results.

By the end you will have built a client, provided it to React, and written a continent → countries browser that you can switch between four cache strategies at runtime.

## Concepts and tooling

The examples below use the **Rick and Morty API** (Labs 02/03/05) so the Countries data in the tasks stays fresh for you.

### 1. A client is a pipeline of exchanges

Every query, mutation or refresh you trigger becomes an **operation**. The urql `Client` pushes it through a list of **exchanges** (middleware); the last one talks to the network, and the **result** travels back up the same list.

```
useQuery ─▶ operation ─▶ cacheExchange ─▶ fetchExchange ─▶ network
                              │  hit: answer from cache              │
useQuery ◀─ result ◀──────────┴──────────────◀────────────────────────┘
```

| Exchange | Job |
| --- | --- |
| `cacheExchange` | **document cache**: stores the *whole result* per (query + variables). No normalization. |
| `fetchExchange` | sends the operation with `fetch` (POST, or GET — see below) |
| `mapExchange` | hook to log or transform operations/results (stretch goal) |
| `@urql/exchange-graphcache` | optional *normalized* cache (stretch goal) |

Order matters: `cacheExchange` must come **before** `fetchExchange`, otherwise the cache is never consulted. In this version of urql the `exchanges` option is required, so you always spell the pipeline out — which is what makes the architecture visible.

### 2. Creating a client

```ts
import { Client, cacheExchange, fetchExchange } from "urql";

export const characterClient = new Client({
  url: "https://rickandmortyapi.com/graphql",   // note: `url` (Apollo's HttpLink calls it `uri`)
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: "within-url-limit",
});
```

**`preferGetMethod`** decides how queries are sent. `"within-url-limit"` sends `GET ?query=…&variables=…` when the URL stays short enough, and falls back to `POST` for long queries. Mutations always use POST. Why care? `GET` responses can be cached by browsers and CDNs — exactly what AEM **persisted queries** rely on in Lab 11.

### 3. Documents

`gql` (re-exported from urql) turns a template string into a document. Annotate it with `TypedDocumentNode<Data, Variables>` and `useQuery` knows the result type:

```ts
import { gql, type TypedDocumentNode } from "urql";

interface LocationsData { locations: { results: { id: string; name: string; type: string }[] } }
interface LocationsVariables { page: number }

export const LOCATIONS_QUERY: TypedDocumentNode<LocationsData, LocationsVariables> = gql`
  query Locations($page: Int) {
    locations(page: $page) { results { id name type } }
  }
`;
```

A query **without variables** uses `Record<string, never>` as the second type argument. The types for this lab are in [types.ts](./types.ts).

### 4. The Provider — create the client once

```tsx
"use client";
import { useState, type ReactNode } from "react";
import { Provider } from "urql";

export function UrqlProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createClient);   // pass the FUNCTION, not createClient()
  return <Provider value={client}>{children}</Provider>;
}
```

A client owns the cache. If you create one inside the render body, every re-render builds a new, empty client and the cache never hits. `useState(fn)` calls `fn` exactly once per mounted component.

### 5. `useQuery`: a tuple, not an object

```tsx
const [result, reexecuteQuery] = useQuery({
  query: LOCATIONS_QUERY,
  variables: { page },
  pause: !page,                  // true → don't run (urql's version of Apollo's `skip`)
  requestPolicy: "cache-first",  // how to use the cache — see section 6
});

const { data, error, fetching, stale } = result;
```

| `result` field | Meaning |
| --- | --- |
| `data` | the typed result; `undefined` until loaded (or when paused) |
| `fetching` | a network request is in flight |
| `stale` | `data` is a cached copy **and** a refresh is running in the background |
| `error` | a `CombinedError` (section 8) |
| `operation.context.meta.cacheOutcome` | `"hit"` / `"miss"` / `"partial"` — this lab shows it in a badge |

`reexecuteQuery(context?)` runs the same query again; the optional argument overrides the context for that run, e.g. `reexecuteQuery({ requestPolicy: "network-only" })`.

### 6. Request policies

| `requestPolicy` | Behaviour |
| --- | --- |
| `cache-first` (default) | cached result → use it, no request. Otherwise fetch. |
| `cache-and-network` | cached result → show it **immediately** (`stale: true`), *and* refetch to update it. |
| `network-only` | always fetch; still writes the result to the cache. |
| `cache-only` | never fetch; `data` stays `undefined` if nothing is cached. |

### 7. How `cacheExchange` invalidates

Documents are cached as a whole, so urql can't patch individual entities. Instead it records the `__typename`s inside each result (it adds `__typename` to your selections automatically). When a **mutation** returns an object of a type, every cached query containing that type is dropped and refetched. Simple and predictable — but it also means "two views of the same entity" are *not* kept in sync the way Apollo does it.

| | urql | Apollo (Lab 03) |
| --- | --- | --- |
| default cache | document cache | normalized cache |
| params to `useQuery` | one object `{ query, variables, pause }` | `(query, { variables, skip })` |
| return | `[result, reexecute]` | `{ data, refetch, … }` |
| error type | `CombinedError { networkError, graphQLErrors }` | `CombinedGraphQLErrors`, `ServerError`, … |

### 8. Errors

`CombinedError` merges everything that can go wrong into one object: `error.networkError` (the `fetch` failed or returned a bad status) or `error.graphQLErrors` (the server's `errors[]`). The provided `ErrorNote` component in [CountryBrowser.tsx](./CountryBrowser.tsx) already renders both.

> [!TIP]
> The **urql Devtools** browser extension (needs `@urql/devtools` as an exchange) shows every operation passing through the pipeline — worth trying in the stretch goals.

## The API

**Countries API** — `https://countries.trevorblades.com/graphql`.

### Data shape: continents

```json
{ "data": { "continents": [{ "code": "AF", "name": "Africa" }, { "code": "AN", "name": "Antarctica" }, "…7 total"] } }
```

### Data shape: `countries(filter: { continent: { eq: "OC" } })`

```json
{
  "data": {
    "countries": [
      { "code": "AS", "name": "American Samoa", "emoji": "🇦🇸", "capital": "Pago Pago", "currency": "USD" },
      { "code": "AU", "name": "Australia", "emoji": "🇦🇺", "capital": "Canberra", "currency": "AUD" }
    ]
  }
}
```

The filter argument is an *input object*: `filter: { continent: { eq: $continent } }`. `eq` means "equals"; the Countries API also offers `in`, `ne`, `regex`…

## Your tasks

### Task 1 — the client · [urql.ts](./urql.ts) → `createUrqlClient()`

Return a `new Client({ … })` (section 2) with:

- `url`: `COUNTRIES_API` (exported from the same file)
- `exchanges`: `[cacheExchange, fetchExchange]` — import both from `"urql"`
- `preferGetMethod`: `"within-url-limit"`

**Works when:** `npm test -- 04` no longer fails on "creates a Client".

### Task 2 — two documents · [urql.ts](./urql.ts) → `CONTINENTS_QUERY`, `COUNTRIES_QUERY`

Keep the `TypedDocumentNode` annotations and replace the placeholder bodies:

```graphql
query Continents {
  continents { code name }
}

query CountriesByContinent($continent: String!) {
  countries(filter: { continent: { eq: $continent } }) {
    code name emoji capital currency
  }
}
```

The variable is declared `String!` (the continent *code*, e.g. `"OC"`) and used inside the `eq` filter — the same pattern as `$code` in Lab 01.

**Works when:** the "loads continents…" and "filters countries by continent…" tests pass.

### Task 3 — the provider · [CountryBrowser.tsx](./CountryBrowser.tsx) → `UrqlLabProvider`

Exactly section 4: `const [client] = useState(createUrqlClient); return <Provider value={client}>{children}</Provider>;`. Import `Provider` from `"urql"` and `createUrqlClient` from `./urql`; remove the `todo(...)` and the `void children;` line.

### Task 4 — continents query · [CountryBrowser.tsx](./CountryBrowser.tsx) → `CountryBrowser`

Replace the first placeholder with `const [continents] = useQuery({ query: CONTINENTS_QUERY });` (import `useQuery` from `"urql"`).

**Works when:** the seven continent buttons appear.

### Task 5 — a paused countries query · [CountryBrowser.tsx](./CountryBrowser.tsx) → `CountryBrowser`

Replace the second placeholder with:

```ts
const [countries, reexecuteCountries] = useQuery({
  query: COUNTRIES_QUERY,
  variables: { continent },
  pause: !continent,
  requestPolicy,
});
```

`continent` starts as `""`, so without `pause` the first render would send an invalid request. `requestPolicy` is the React state wired to the dropdown.

**Works when:** nothing is requested until you click a continent (DevTools → Network is quiet), and Europe → Asia → Europe shows `cache hit` on the second Europe.

### Task 6 — refresh · [CountryBrowser.tsx](./CountryBrowser.tsx) → `refresh`

Call `reexecuteCountries({ requestPolicy: "network-only" })`.

**Works when:** clicking "Refresh" sends a request even though the data is cached, and the badge changes accordingly.

## Acceptance criteria

- `npm test -- 04` passes (including a cache **hit** on the second identical query).
- Switching Europe → Asia → Europe shows "cache hit" for the second Europe and no new request in DevTools.
- In DevTools → Network, the requests are `GET countries.trevorblades.com/graphql?query=…`.
- With `cache-and-network`, the badge shows `stale` while urql refreshes cached data in the background.

## Stretch goals

- Add `@urql/exchange-graphcache` and compare: what changes when the cache is normalized?
- Write a tiny custom exchange that `console.log`s every operation key and result (`mapExchange` from `urql` makes it a few lines).
