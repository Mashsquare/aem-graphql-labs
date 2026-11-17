## The landscape at a glance

npm downloads in the last month and latest versions, fetched from the npm registry on **23 October 2026**. Download counts include installs pulled in by other packages, so read them as "how common", not "how loved".

| Package | Monthly downloads | Latest | What it is | Lab |
| --- | ---: | --- | --- | --- |
| `@tanstack/react-query` | 279.2M | 5.104 | async state & caching for any fetcher | 05 |
| `graphql` (graphql-js) | 202.6M | 17.0 | the reference implementation: parser, validator, `print`, AST tools | all |
| `graphql-tag` | 64.2M | 2.12 | the classic `gql` template tag | — |
| `graphql-ws` | 48.4M | 6.4 | GraphQL over WebSocket (subscriptions — AEM has none) | — |
| `graphql-request` | 40.5M | 7.4 | minimal promise-based client | 05, 06 |
| `@graphql-codegen/cli` | 30.5M | 7.4 | GraphQL Code Generator | 06, 15 |
| `@graphql-codegen/client-preset` | 27.7M | 6.2 | the recommended codegen preset (typed `graphql()`, fragment masking) | 06, 15 |
| `@apollo/client` | 25.4M | 4.3 | full-featured client with a normalized cache | 03, 08, 09 |
| `urql` | 4.8M | 5.0 | lightweight, exchange-based client | 04 |
| `graphiql` | 3.8M | 5.4 | the GraphQL IDE (AEM ships one at `/aem/graphiql.html`) | mock |
| `gql.tada` | 3.3M | 1.11 | type inference from the schema without a codegen step | — |
| `react-relay` | 2.0M | — | Meta's compiler-driven client (rare in AEM projects) | — |
| `@apollo/client-integration-nextjs` | 0.9M | 0.14 | Apollo for the Next.js App Router (RSC + streaming SSR) | 03 |
| `@urql/next` | 0.25M | 2.0 | urql for the Next.js App Router | — |
| `@adobe/aem-headless-client-js` | 40k | 4.0 | **Adobe's official AEM headless SDK** (browser + Node) | 11 |
| `@adobe/aem-headless-client-nodejs` | 3.8k | 2.0 | Node.js variant with service-credential (IMS) auth | — |

> [!NOTE]
> This project pins `graphql@16` because `graphql-request@7` declares `graphql 14 – 16` as its peer range. Everything else supports v17.

## Which client for an AEM project?

| Situation | Good fit |
| --- | --- |
| Mostly Server Components + persisted queries | plain `fetch` / `@adobe/aem-headless-client-js`, cached with `"use cache"` (Labs 07, 11, 15) |
| Client-side interactivity, simple caching, many REST calls too | **TanStack Query** + a fetcher (graphql-request or the AEM SDK) (Lab 05) |
| Large client-side app, shared entities across many views | **Apollo Client** — remember `keyFields: ["_path"]` (Labs 03, 08, 09) |
| Small bundle, explicit cache behaviour, GET by default | **urql** (Lab 04) |
| Any of the above | **GraphQL Code Generator** (or gql.tada) for types (Lab 06) |

Adobe's own reference apps (WKND React / Next.js tutorials) use `@adobe/aem-headless-client-js` with simple hooks or Server Components. In enterprise codebases you'll very often find Apollo or TanStack Query on top.

## Developer tools worth installing

- **AEM GraphiQL IDE** — `/aem/graphiql.html` on Author: explore the schema, build queries, and persist/publish them from the UI.
- **GraphQL: Language Feature Support** (VS Code, by the GraphQL Foundation) — autocompletion and validation inside `gql`/`graphql()` strings. This repo ships a `graphql.config.ts` with three projects (mock AEM, Countries, Rick and Morty).
- **Apollo Client Devtools** (browser extension) — inspect queries and the normalized cache.
- **TanStack Query Devtools** — `@tanstack/react-query-devtools`.
- An HTTP client (Bruno, Insomnia, Postman, or plain `curl`) for persisted queries and replication calls.

## Cheat sheet: the same query in every client

```ts
// fetch
await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }) });

// graphql-request
await request(url, DOCUMENT, variables);

// Apollo Client (React)
const { data, loading, error } = useQuery(DOCUMENT, { variables });

// urql
const [{ data, fetching, error }] = useQuery({ query: DOCUMENT, variables });

// TanStack Query
const { data } = useQuery({ queryKey: ["adventures", variables], queryFn: () => request(url, DOCUMENT, variables) });

// AEM headless SDK — persisted query
const { data } = await aem.runPersistedQuery("wknd-shared/adventure-by-slug", { slug });
```
