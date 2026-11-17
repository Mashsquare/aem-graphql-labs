## Goal

Talk to a GraphQL API with nothing but `fetch`. By the end you'll know exactly what every GraphQL client library does under the hood — which makes them a lot less magical when you debug one at work.

## Background: GraphQL is "just" HTTP

A GraphQL request is usually an HTTP `POST` with a JSON body:

```http
POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "query Country($code: ID!) { country(code: $code) { name capital } }",
  "variables": { "code": "BR" },
  "operationName": "Country"
}
```

The response is **always** a JSON object with `data` and/or `errors`:

```json
{ "data": { "country": { "name": "Brazil", "capital": "Brasília" } } }
```

> [!IMPORTANT]
> Most GraphQL servers answer **HTTP 200 even when the query is invalid** — the problem is reported in `errors`. AEM behaves the same way. A request helper that only checks `response.ok` will happily hand `undefined` to your UI. Always check `errors`.

```json
{
  "errors": [
    {
      "message": "Cannot query field \"nam\" on type \"Country\". Did you mean \"name\"?",
      "locations": [{ "line": 3, "column": 5 }],
      "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }
    }
  ]
}
```

## The API

**Countries API** — `https://countries.trevorblades.com/graphql` (public, no auth). Open that URL in your browser to get an interactive explorer with the schema docs.

### Data shape: continents

```graphql
query Continents {
  continents {
    code
    name
    countries {
      code
    }
  }
}
```

```json
{
  "data": {
    "continents": [
      { "code": "AF", "name": "Africa", "countries": [{ "code": "AO" }, { "code": "BF" }, "… 58 total"] },
      { "code": "AN", "name": "Antarctica", "countries": ["… 5 total"] },
      { "code": "AS", "name": "Asia", "countries": ["… 52 total"] }
    ]
  }
}
```

### Data shape: one country

```json
{
  "data": {
    "country": {
      "code": "BR",
      "name": "Brazil",
      "native": "Brasil",
      "capital": "Brasília",
      "emoji": "🇧🇷",
      "currency": "BRL",
      "languages": [{ "code": "pt", "name": "Portuguese" }],
      "continent": { "name": "South America" }
    }
  }
}
```

An unknown code returns `{ "data": { "country": null } }` — not an error.

## Your tasks

All work happens in [api.ts](./api.ts). The workspace tab renders the result.

1. **`graphqlRequest()`** — implement a generic request function:
   - `POST` to `COUNTRIES_API` with `Content-Type: application/json` and a JSON body containing `query` and `variables`.
   - If the HTTP status is not OK, throw an `Error` that includes the status.
   - If the body has an `errors` array, throw an `Error` whose message joins all `errors[].message` values with `"; "`.
   - Otherwise return `data`, typed as `TData`.
2. **`CONTINENTS_QUERY`** — write a *named* query (`query Continents { … }`) that returns `code`, `name` and the `code` of every country of each continent.
3. **`getContinents()`** — run the query and return the continents array.
4. **`COUNTRY_QUERY`** — write `query Country($code: ID!)` returning the fields shown in the data shape above.
5. **`getCountry(code)`** — pass the code as a **variable** (never string-concatenate user input into a query!) and return the country or `null`.

When you're done, the workspace shows every continent with its country count; click a continent's countries to see details.

## Acceptance criteria

- `npm test -- 01` passes (it stubs `fetch` to check your request format, then calls the real API).
- The workspace renders 7 continents and the country detail card for `?country=BR`.
- Changing `name` to `nam` in a query shows the server's validation message in the UI instead of a blank page.

> [!TIP]
> Looking for the request in your browser's Network tab? It isn't there. The workspace is a **Server Component**, so `fetch` runs in Node.js on the Next.js server — debug with `console.log` and watch the terminal. Labs 3–5 move requests into the browser.

## Stretch goals

- Add `operationName` to the request body and confirm the API accepts it.
- Try sending the same query with `GET ?query=…` (many servers — and AEM persisted queries — support GET so CDNs can cache responses).
- Add an `AbortSignal` timeout: `fetch(url, { signal: AbortSignal.timeout(5000) })`.
