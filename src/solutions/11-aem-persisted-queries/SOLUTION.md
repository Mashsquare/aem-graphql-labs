## Walkthrough

### Configure the SDK correctly

```ts
new AEMHeadless({ serviceURL: publishHost, endpoint, fetch: (input, init) => fetch(input, init) });
```

- **`endpoint`** — the SDK defaults to `content/graphql/global/endpoint.json`. `runPersistedQuery` doesn't use it, but `runQuery` does, and the global endpoint doesn't know the `wknd-shared` models.
- **`fetch`** — the SDK looks for `window.fetch`/`self.fetch`; on the server you must pass one. Wrapping it keeps Next.js' patched `fetch` (and its caching options) and avoids `this`-binding issues in browsers.
- **`auth`** — `[user, password]` → Basic, string → Bearer. On AEM as a Cloud Service you'd use a **local development token** (Developer Console) for development and **service credentials** (exchanged for an IMS access token) for servers/CI.

### Upsert + replicate

```ts
try {
  await author.persistQuery(payload, shortPath);                    // PUT
} catch (error) {
  if ((error as AEMHeadlessError).sdkDetails?.status !== 409) throw error;
  await author.persistQuery(payload, shortPath, { method: "POST" }); // update
}
await replicate(`/conf/${CONFIGURATION}/settings/graphql/persistentQueries/${name}`);
```

The payload is the JSON form so it can carry `cache-control`/`surrogate-control`. Persisted queries are **content** under `/conf` — they follow the same author → publish flow as fragments.

> [!NOTE]
> The mock answers PUT on an existing query with **409** and POST on a missing one with **404**. On real AEM, check the response of your version — the robust pattern is the same: try create, fall back to update.

In real projects this script runs in **CI** against Author, and the queries reach Publish through a content package or a replication step. Treat persisted queries like code: versioned in git, reviewed, deployed.

### Matrix URLs

```ts
`;${name}=${encodeURIComponent(typeof value === "string" ? value : JSON.stringify(value))}`
```

`a;b=c/d` becomes `a%3Bb%3Dc%2Fd`. The SDK goes further and encodes the *whole* suffix (`%3Bslug%3D…`) and appends a trailing `;`, which AEM accepts too.

### Two cache layers

```ts
export async function getCachedAdventures(difficulty: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 3600 });
  cacheTag(ADVENTURES_TAG);
  return { items: await getAdventuresByDifficulty(difficulty), fetchedAt: new Date().toISOString() };
}
```

1. **AEM → CDN**: `Surrogate-Control` keeps the persisted query response at the edge (here 10 min).
2. **Next.js**: `"use cache"` keeps the *function result* in the Next.js cache, keyed by its arguments, revalidated after 120 s, and tagged so it can be expired on demand (`updateTag` in a Server Action, `revalidateTag` from a webhook — Lab 15).

Line the lifetimes up deliberately: there's no point revalidating Next.js every 10 s if the CDN in front of AEM serves the same response for 2 h.

## Real-world notes

- `POST` to `execute.json` (variables in the body) works but can't be cached by the CDN — use GET.
- With Dispatcher caching of persisted queries enabled (`CACHE_GRAPHQL_PERSISTED_QUERIES`), values with `;` are not allowed and `/` gets double-encoded — keep variable values simple (slugs, ids).
- Ad-hoc queries on Publish are blocked by the Dispatcher by default. Start the mock with `MOCK_AEM_BLOCK_ADHOC_ON_PUBLISH=true` to experience that.
