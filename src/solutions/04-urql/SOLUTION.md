## Walkthrough

### The client is the pipeline

```ts
new Client({
  url: COUNTRIES_API,
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: "within-url-limit",
});
```

- `cacheExchange` sees the operation first. On a hit it returns the cached result and the operation never reaches `fetchExchange`.
- The cache key is a hash of the **document + variables**. `{ continent: "EU" }` and `{ continent: "AS" }` are different entries; repeating `"EU"` is a hit.
- With GET, the request looks like `GET /graphql?query=query+CountriesByContinent…&variables={"continent":"EU"}`. Long documents (> 2048 chars) fall back to POST automatically.

### Create the client once

```tsx
const [client] = useState(createUrqlClient);
```

Creating the client in the render body would make a new client (and an empty cache) on every render. `useState(factory)` runs the factory once per mounted provider. (Apollo's `ApolloNextAppProvider` does the equivalent for you.)

### pause and requestPolicy

```ts
const [countries, reexecuteCountries] = useQuery({
  query: COUNTRIES_QUERY,
  variables: { continent },
  pause: !continent,
  requestPolicy,
});
```

- `pause` keeps the hook mounted but idle; `fetching` stays false and `data` undefined.
- Changing `variables` or `requestPolicy` re-runs the query automatically.
- `reexecuteCountries({ requestPolicy: "network-only" })` is a one-off override — useful for a "refresh" button or after a mutation.

### CombinedError

urql folds everything into one `CombinedError`: `networkError` (fetch failed, non-2xx) **or** `graphQLErrors` (the `errors` array). `error.message` is a pre-formatted summary like `[GraphQL] Cannot query field "nam"…`.

## When would you choose urql in an AEM project?

AEM content is read-only over GraphQL (no mutations), mostly fetched by persisted query, and usually rendered on the server. A document cache is often all you need — and urql's GET-by-default behaviour plays nicely with CDN caching. Apollo's normalized cache pays off when the same entities are shown in many places and updated by mutations.
