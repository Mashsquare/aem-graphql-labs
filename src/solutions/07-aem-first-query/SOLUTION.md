## Walkthrough

### The endpoint

```ts
export function aemGraphQLUrl() {
  const { publishHost, endpoint } = aemConfig();
  return `${publishHost}${endpoint}`; // http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.json
}
```

`cq:graphql` is a JCR namespace; AEM also answers on `/content/_cq_graphql/<config>/endpoint.json`. The configuration name (`wknd-shared`) decides **which models** are in the schema — a common first-day mistake is querying the `global` endpoint and wondering why your model type doesn't exist.

### Errors carry a classification

AEM runs on graphql-java, which tags errors with `extensions.classification`:

| classification | meaning |
| --- | --- |
| `InvalidSyntax` | the document doesn't parse |
| `ValidationError` | unknown field/argument, wrong operator for the type, missing variable |
| `DataFetchingException` | the query was valid but resolving failed (bad sort field, invalid cursor, …) |

All of them arrive with **HTTP 200**. Message wording differs between graphql-java (real AEM) and graphql-js (this mock) — rely on the classification and the field names, not on exact text.

### Content references are a union

```graphql
primaryImage {
  ... on ImageRef { _dynamicUrl width height }
}
```

`primaryImage` could in principle be any DAM asset (`ImageRef`, `DocumentRef`, `MultimediaRef`, `ArchiveRef`), so you select fields per type with inline fragments. Fragment references (`location`) are typed with the referenced model directly when the model allows only one type.

### ByPath returns `{ item: null }`

```ts
return data.adventureByPath.item; // AdventureDetail | null
```

On Publish, "not found" and "not published yet" look identical. That is a feature: unpublished content must never leak.

### Relative `_dynamicUrl`

```ts
new URL(dynamicUrl, aemConfig().publishHost).toString();
```

AEM deliberately returns `_dynamicUrl` without a host so the same content works behind different domains/CDNs. Your app decides the origin (Publish for visitors, Author for previews). Lab 13 goes deeper.

## Real-world notes

- In production you typically **don't** POST ad-hoc queries to Publish — the Dispatcher blocks them by default and they can't be CDN-cached. You use persisted queries (Lab 11). POSTing is perfect for development and for learning the schema.
- Keep the AEM host in environment variables (`AEM_PUBLISH_HOST`), never hard-coded: you'll have dev, stage and prod environments (`publish-p<program>-e<env>.adobeaemcloud.com`).
