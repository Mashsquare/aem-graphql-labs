## Goal

Apollo Client is the most widely used GraphQL client (≈25M npm downloads/month) and the one you're most likely to meet in an enterprise AEM frontend. In this lab you set it up for the **Next.js App Router**, query from Client Components, paginate with `fetchMore` and learn to read the **normalized cache** — the feature that makes Apollo powerful and, when misconfigured, confusing.

By the end you will have written, in a real app: a client factory, a cache policy that merges pages, two typed documents and the hooks that use them.

## Concepts and tooling

Read this section first — every task below uses something introduced here. The examples use the **Countries API** (Lab 01) on purpose, so you learn the pattern here and *apply* it to Rick and Morty in the tasks.

### 1. What a GraphQL client adds on top of `fetch`

In Lab 01 you wrote `graphqlRequest()` yourself. A client library gives you the parts that are tedious to build correctly:

| Need | With plain `fetch` | With Apollo Client |
| --- | --- | --- |
| loading / error / data state in React | `useState` + `useEffect` + cancellation | `useQuery` returns `{ data, loading, error }` |
| don't refetch what you already have | hand-rolled cache | `InMemoryCache`, keyed by query + variables, **normalized** by entity |
| appending page 2 to page 1 | manual state | `fetchMore` + a field policy |
| the same entity shown in two places stays in sync | impossible without a store | one cache entry per entity |

### 2. Packages and import paths (Apollo Client 4)

Apollo 4 split the old all-in-one entry point. Importing from the wrong path is the most common first error:

| You need | Import from |
| --- | --- |
| `gql`, `HttpLink`, `NetworkStatus`, `TypedDocumentNode`, `TypePolicies` | `@apollo/client` |
| `useQuery`, `useSuspenseQuery`, `useApolloClient`, `skipToken` | `@apollo/client/react` |
| `CombinedGraphQLErrors`, `ServerError` (replace the old `ApolloError`) | `@apollo/client/errors` |
| `relayStylePagination` and other cache helpers (Lab 09) | `@apollo/client/utilities` |
| `ApolloClient`, `InMemoryCache`, `ApolloNextAppProvider` **for Next.js** | `@apollo/client-integration-nextjs` |

> [!NOTE]
> Why a separate Next.js package? In the App Router, Client Components are rendered **twice**: once on the server (SSR) and once in the browser. `@apollo/client-integration-nextjs` makes sure the browser gets exactly **one** client per tab and that results fetched during SSR are streamed into its cache instead of being fetched again.

### 3. Setting up the client for the App Router

You write a **factory** and hand it to a provider. In a real project that looks like this (here for the Countries API):

```tsx
// app/apollo-wrapper.tsx
"use client";
import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache, ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "https://countries.trevorblades.com/graphql" }),
  });
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
```

Three things to remember: (1) `makeClient` is a *function* — Apollo calls it for you, once in the browser and once per server request; (2) `ApolloClient` and `InMemoryCache` come from the **Next.js package**, not from `@apollo/client`; (3) `HttpLink` takes `uri` (not `url`, which is what urql uses). In this lab the provider already exists in [ApolloLabProvider.tsx](./ApolloLabProvider.tsx) — you only write `makeClient`.

### 4. `useQuery`: the loop you will write every day

```tsx
"use client";
import { gql } from "@apollo/client";
import { skipToken, useQuery } from "@apollo/client/react";

const COUNTRY = gql`
  query Country($code: ID!) {
    country(code: $code) { code name capital }
  }
`;

function CountryCard({ code }: { code: string | null }) {
  // skipToken = "don't run yet". Same idea as `skip: true`, but TypeScript-friendly:
  // when the variables don't exist yet you can't pass them.
  const { data, loading, error } = useQuery(COUNTRY, code ? { variables: { code } } : skipToken);

  if (error) return <p>{error.message}</p>;
  if (loading) return <p>Loading…</p>;
  return <p>{data?.country?.name}</p>;
}
```

Useful result fields beyond `data`/`loading`/`error`:

| Field | Meaning |
| --- | --- |
| `previousData` | the last successful `data` for *different* variables — use it to avoid flicker while a new search loads |
| `networkStatus` | a `NetworkStatus` enum: `loading`, `setVariables`, `fetchMore`, `refetch`, `ready`, `error`… |
| `fetchMore` | run the same query with *different* variables and merge the result into the cache |

By default `loading` stays `false` during a `fetchMore`. Pass **`notifyOnNetworkStatusChange: true`** and compare `networkStatus === NetworkStatus.fetchMore` to show a "Loading more…" state.

**Typing without generics.** Annotate the document once and `useQuery` infers everything:

```ts
import type { TypedDocumentNode } from "@apollo/client";
const COUNTRY: TypedDocumentNode<{ country: { name: string } | null }, { code: string }> = gql`…`;
```

Lab 06 generates these types for you; here they are provided in [types.ts](./types.ts).

### 5. The normalized cache

Apollo does **not** store whole responses. It walks the response and stores every object **once**, under the key `Typename:id`; lists and parents hold *references* to those entries.

For `query { character(id: 1) { id name species } }` against Rick and Morty the cache holds:

```json
{
  "ROOT_QUERY": {
    "character({\"id\":\"1\"})": { "__ref": "Character:1" }
  },
  "Character:1": { "__typename": "Character", "id": "1", "name": "Rick Sanchez", "species": "Human" }
}
```

Two consequences you will see in the **cache inspector** of this lab:

- Selecting the same entity from another query *updates the same entry* — every component showing it re-renders.
- A query with arguments is stored under the field **plus its arguments**: `character({"id":"1"})` and `character({"id":"2"})` are different entries. This matters in section 6.

How does Apollo know the id? By default it looks for `id` or `_id` plus `__typename` (it adds `__typename` to every selection for you — never write it). An object **without** an id (like the Countries API's `Country`, which is identified by `code`) is not normalized: it is stored inline inside its parent. When the identifier has another name you declare it:

```ts
new InMemoryCache({
  typePolicies: {
    Country: { keyFields: ["code"] },   // → cache key  Country:{"code":"BR"}
  },
});
```

> [!IMPORTANT]
> AEM fragments have no `id` field — they have `_path`. Lab 08 uses exactly this `keyFields` policy. This lab uses an API with `id`s so you can see the default behaviour first.

### 6. Field policies: `keyArgs` and `merge` (pagination)

A **type policy** customises how one type/field is stored. For lists that grow page by page you need two settings on the *query field*:

- **`keyArgs`** — which arguments make it a **different list**. By default *all* arguments do, so `characters(page: 1)` and `characters(page: 2)` become two unrelated cache entries and `fetchMore` would show page 2 *instead of* page 1. Listing `keyArgs: ["filter"]` says: a different filter is a different list; a different page is the same list.
- **`merge(existing, incoming, { args })`** — called whenever a result for that field arrives. Whatever you return becomes the stored value. `existing` is `undefined` the first time.

A worked example for a different field (`characters`, same shape as the episodes in this lab):

```ts
const typePolicies: TypePolicies = {
  Query: {
    fields: {
      characters: {
        keyArgs: ["filter"],
        merge(existing, incoming) {
          if (!existing) return incoming;
          return { ...incoming, results: [...existing.results, ...incoming.results] };
        },
      },
    },
  },
};
```

Read it carefully: it appends *every* time. What happens when the user types a new search term? With `keyArgs: ["filter"]` the new filter gets its own entry, so it starts empty — good. But what if the **same** filter is refetched from page 1 (a manual refresh)? The old results plus the fresh ones would be concatenated into duplicates. Your task is to handle that case using `args.page`.

### 7. `fetchMore`

`fetchMore({ variables })` re-runs the original query with the given variables **merged over** the original ones, then sends the result through your `merge` function. You only pass what changes:

```ts
fetchMore({ variables: { page: 2 } });   // `filter` is reused from the original useQuery
```

### 8. Errors in Apollo 4

`error` is a typed object, not a generic `ApolloError`. Narrow it with the static `is()` helper:

```ts
import { CombinedGraphQLErrors } from "@apollo/client/errors";

if (CombinedGraphQLErrors.is(error)) {
  error.errors.map((e) => e.message);   // the server's `errors[]` (validation, resolver errors…)
} else {
  error.message;                        // network failure, non-JSON response, …
}
```

> [!TIP]
> Install the **Apollo Client Devtools** browser extension — it shows queries, cache contents and lets you run operations against your client. It works with this lab.

## The API

**Rick and Morty API** — `https://rickandmortyapi.com/graphql`. 51 episodes, 20 per page.

### Data shape: `episodes(page: 1, filter: { name: "" })`

```json
{
  "data": {
    "episodes": {
      "__typename": "Episodes",
      "info": { "count": 51, "pages": 3, "next": 2, "prev": null },
      "results": [
        { "__typename": "Episode", "id": "1", "name": "Pilot", "episode": "S01E01", "air_date": "December 2, 2013" }
      ]
    }
  }
}
```

`info.next` is the next page number, or `null` on the last page.

### Data shape: `episode(id: 1)`

```json
{
  "data": {
    "episode": {
      "id": "1", "name": "Pilot", "episode": "S01E01", "air_date": "December 2, 2013",
      "characters": [
        { "id": "1", "name": "Rick Sanchez", "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg", "species": "Human" }
      ]
    }
  }
}
```

(`__typename` is added to every selection automatically by Apollo — you don't write it.)

## Your tasks

Work through them in order. The workspace tab shows a TODO box naming the next function you still have to implement.

### Task 1 — the client factory · [apollo.ts](./apollo.ts) → `makeClient()`

Return a new `ApolloClient` (concept 3):

- `link`: `new HttpLink({ uri: RICK_AND_MORTY_API })`
- `cache`: `new InMemoryCache({ typePolicies })` — `typePolicies` is the object exported from the same file (you fill it in with Task 2).
- Import `ApolloClient` and `InMemoryCache` from `@apollo/client-integration-nextjs`; the starter already imports them.

**Works when:** the workspace stops showing the `makeClient` TODO box.

### Task 2 — the pagination policy · [apollo.ts](./apollo.ts) → `typePolicies.Query.fields.episodes`

Concept 6, applied to `episodes`:

1. `keyArgs: ["filter"]`.
2. `merge(existing, incoming, { args })` with these exact rules:

   | Situation | Return |
   | --- | --- |
   | `existing` is `undefined`, **or** `args?.page` is `1` or `undefined` | `incoming` (start over) |
   | otherwise | `{ ...incoming, results: [...existing.results, ...incoming.results] }` |

   Why return `{ ...incoming, … }` and not `{ ...existing, … }`? Because `info` (with the new `next`) must come from the **latest** page, otherwise "Load more" never advances.

**Works when:** after Task 5, the cache inspector shows a **single** `episodes({"filter":{"name":""}})` entry however many times you click "Load more".

### Task 3 — the documents · [queries.ts](./queries.ts)

Replace both placeholder queries. Keep the `TypedDocumentNode<…>` annotations — they type the hooks.

```graphql
query Episodes($page: Int, $filter: FilterEpisode) {
  episodes(page: $page, filter: $filter) {
    info { count pages next prev }
    results { id name episode air_date }
  }
}

query Episode($id: ID!) {
  episode(id: $id) {
    id name episode air_date
    characters { id name image species }
  }
}
```

Use the *operation names exactly as written* (`Episodes`, `Episode`) — the tests and the devtools identify queries by name.

### Task 4 — run the list query · [EpisodeExplorer.tsx](./EpisodeExplorer.tsx) → `EpisodeExplorer`

Replace the first `todo(...)` with:

```ts
const { data, previousData, loading, error, networkStatus, fetchMore } = useQuery(EPISODES_QUERY, {
  variables: { page: 1, filter: { name: search } },
  notifyOnNetworkStatusChange: true,
});
```

Import `useQuery` as a **value** from `@apollo/client/react` (the starter only imports its *type*) and `EPISODES_QUERY` from `./queries`. Delete the `as useQuery.Result<…>` cast and the `todo` import if nothing else uses it.

**Works when:** the list of 20 episodes renders; typing in the filter box swaps the list without flicker.

### Task 5 — load more · [EpisodeExplorer.tsx](./EpisodeExplorer.tsx) → `loadMore`

Call `fetchMore({ variables: { page: page.info.next } })`. Guard it: if `page?.info.next` is `null`/`undefined`, do nothing (the button is already hidden then, but a double click shouldn't send `page: undefined`).

**Works when:** clicking "Load more" three times shows 51 of 51 and the button disappears.

### Task 6 — details with `skipToken` · [EpisodeExplorer.tsx](./EpisodeExplorer.tsx) → `EpisodeDetails`

Use concept 4: `useQuery(EPISODE_QUERY, id ? { variables: { id } } : skipToken)`. Remove the conditional `todo(...)` wrapper.

**Works when:** selecting episode A, then B, then A again renders A the third time with **no request** in DevTools → Network.

### Task 7 — readable errors · [EpisodeExplorer.tsx](./EpisodeExplorer.tsx) → `ErrorMessage`

Use `CombinedGraphQLErrors.is(error)` (concept 8): when true, render one line per `error.errors[].message`; otherwise keep the existing fallback (`error.message`).

**Works when:** you temporarily change `air_date` to `air_dat` in `EPISODES_QUERY` and the UI lists the server's validation message (`Cannot query field "air_dat" on type "Episode"…`). Change it back afterwards.

## Acceptance criteria

- `npm test -- 03` passes (cache policy tests + a live query through your client).
- "Load more" appends episodes until all 51 are shown; the cache inspector shows a **single** `episodes({"filter":…})` entry under ROOT_QUERY, not one per page.
- Selecting an episode, another one, then the first again: the third selection renders instantly with no network request (DevTools → Network).
- Breaking a query on purpose (e.g. select `nam`) shows the GraphQL error list.

## Stretch goals

- Debounce the search input (`useDeferredValue` is the React 19 way).
- Switch `EpisodeDetails` to `useSuspenseQuery` and wrap it in `<Suspense>`.
- Add `fetchPolicy: "cache-and-network"` and watch `networkStatus` change on re-selection.
