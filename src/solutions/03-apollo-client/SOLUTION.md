## Walkthrough

### The client

```ts
export function makeClient(): ApolloClient {
  return new ApolloClient({
    cache: new InMemoryCache({ typePolicies }),
    link: new HttpLink({ uri: RICK_AND_MORTY_API }),
  });
}
```

`makeClient` is a *factory*, not a module-level `const client = new ApolloClient(...)`. During SSR every request must get a fresh client (otherwise users would share each other's cache), while the browser keeps one per tab. `ApolloNextAppProvider` handles both — that's why it takes `makeClient`, not `client`.

### keyArgs + merge = one growing list

```ts
episodes: {
  keyArgs: ["filter"],
  merge(existing, incoming, { args }) {
    const page = args?.page ?? 1;
    if (!existing || page === 1) return incoming;
    return { ...incoming, results: [...existing.results, ...incoming.results] };
  },
},
```

- `keyArgs` decides the cache key: `episodes({"filter":{"name":""}})` regardless of `page`.
- `merge` receives the stored value and the new page and returns what to store. Returning `incoming` for page 1 makes `refetch()` and new searches start clean.
- `results` contain **references** (`{ __ref: "Episode:21" }`), not copies, so the same episode appearing in two lists is stored once.

> [!NOTE]
> For cursor-based APIs (like AEM's `…Paginated` queries) you don't write this by hand: `relayStylePagination()` from `@apollo/client/utilities` is a ready-made field policy. Lab 09 uses it.

### Typed documents

```ts
export const EPISODES_QUERY: TypedDocumentNode<EpisodesData, EpisodesVariables> = gql`…`;
const { data } = useQuery(EPISODES_QUERY, { variables: { page: 1, filter: { name: search } } });
```

`data` is `EpisodesData | undefined` and `variables` is type-checked. In Lab 06 these types are generated instead of written.

### Loading states in Apollo 4

- `loading` is true for *any* in-flight request for this hook.
- `networkStatus` tells you which kind: `loading` (1), `setVariables` (2), `fetchMore` (3), `refetch` (4), … Use it to show "Loading more…" on the button while keeping the list visible.
- `previousData` keeps the last result while new variables load — no flicker while typing.

### skipToken

`useQuery(EPISODE_QUERY, id ? { variables: { id } } : skipToken)` skips the query until an id exists *and* keeps `variables` strictly typed (the old `skip: true` option forced you to pass fake variables).

### Errors

Apollo 4 errors are classes you narrow with static `.is()` checks:

```ts
if (CombinedGraphQLErrors.is(error)) error.errors.map((e) => e.message); // GraphQL `errors`
else /* ServerError, network TypeError, ... */
```

## Real-world notes

- One `ApolloNextAppProvider` in `app/layout.tsx`, one `registerApolloClient()` for Server Components (`getClient().query(...)`). This repo needs a scoped variant only because it hosts many unrelated apps.
- Avoid `useQuery` in deep leaf components. Query once per page and pass data down (or use fragments + `useFragment`), otherwise you'll fire many small requests.
