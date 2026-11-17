## Walkthrough

### 1. The request helper

```ts
const response = await fetch(COUNTRIES_API, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ query, variables }),
});
```

Three failure modes, three checks — in this order:

| Failure | What you see | Check |
| --- | --- | --- |
| Network / DNS / CORS | `fetch` rejects (`TypeError: fetch failed`) | let it propagate |
| Proxy, auth, server crash | non-2xx status, body may not even be JSON | `if (!response.ok)` |
| Invalid query, resolver error | **HTTP 200** with `errors` | `if (body.errors?.length)` |

`variables` is omitted from the JSON when `undefined` (`JSON.stringify` drops it), which servers accept.

### 2. Named operations

`query Continents { … }` instead of an anonymous `{ … }`. The name shows up in server logs, APM tools, Apollo DevTools and — in AEM — makes persisted queries easier to recognise. Make it a habit.

### 3. Variables, not string concatenation

```ts
graphqlRequest<CountryData>(COUNTRY_QUERY, { code });
```

Variables are typed by the schema (`$code: ID!`), validated by the server and keep the query text constant — which is what makes **persisted queries** (Lab 11) possible: the query is stored once and only variables change.

### Why `country: null` is not an error

`country(code: ID!)` returns a nullable `Country`. "Nothing found" is modelled as `null` data, not as an error. AEM does the same for `<model>ByPath` (`item: null`). Your UI must handle both: errors (throw) and empty results (render an empty state).

## Real-world notes

- Every client library you'll use (Apollo, urql, graphql-request) ends up calling `fetch` like this. When something misbehaves, the Network tab and the raw JSON are the ground truth.
- AEM's GraphQL endpoint is `POST /content/cq:graphql/<config>/endpoint.json` — same protocol, different URL (Lab 07).
