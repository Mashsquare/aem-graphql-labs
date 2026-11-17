## Goal

Query AEM for the first time. You'll learn where the endpoint lives, how AEM turns **Content Fragment Models** into GraphQL types and queries, and what a content reference (an image from the DAM) looks like in a response. You build a small AEM client with plain `fetch` — the same thing every later lab (and the helpers in `src/lib/aem/`) is built on.

> [!NOTE]
> This lab uses the **mock AEM Publish** tier on `http://localhost:4503` (started by `npm run dev`). Open [its GraphiQL IDE](http://localhost:4503/aem/graphiql.html) in another tab — real AEM ships the same tool at `/aem/graphiql.html`.

## Concepts and tooling

The examples in this section use the **Location** model. The tasks use **Adventure**. Learn the pattern here, apply it there.

### 1. From models to a schema

In AEM, authors create **Content Fragments** (structured content stored as assets in the DAM) based on **Content Fragment Models** that developers define (Tools → General → Content Fragment Models; stored under `/conf/<configuration>/settings/dam/cfm/models`). AEM then *generates a GraphQL schema* from the models of a Sites **configuration** — you never write schema by hand.

| Model `location` in configuration `wknd-shared` | What AEM generates |
| --- | --- |
| type | `LocationModel` |
| one fragment, by path | `locationByPath(_path: String!): LocationModelResult!` → `{ item }` |
| many fragments | `locationList(filter, sort, offset, limit, _locale, variation, …): LocationModelResults!` → `{ items }` |
| cursor paging | `locationPaginated(first, after, …)` (Lab 09) |
| endpoint | `POST /content/cq:graphql/wknd-shared/endpoint.json` |

The naming rule is mechanical: model `adventure` → `AdventureModel`, `adventureByPath`, `adventureList`, `adventurePaginated`. The configuration name is part of the endpoint URL, and an endpoint only exposes **its own configuration's** models.

Every fragment also exposes helper fields that start with `_`: `_path` (its repository path — **the identifier**; fragments have no `id`), `_id`, `_variation`, `_metadata`, `_model`, `_tags`.

### 2. Your first two queries, anatomy included

**A list.** The result is wrapped in an object with an `items` array — you always select *through* `items`:

```graphql
query Locations {
  locationList(_locale: "en", sort: "country ASC, name ASC", limit: 2) {
    items {              # ← the wrapper
      name
      country
    }
  }
}
```

```json
{ "data": { "locationList": { "items": [
  { "name": "El Chaltén", "country": "Argentina" },
  { "name": "Murray River", "country": "Australia" }
] } } }
```

**One by path.** The argument is the fragment's `_path`; the result is wrapped in `item`. Pass the path as a **variable**, never by string concatenation:

```graphql
query LocationByPath($path: String!) {
  locationByPath(_path: $path) {
    item { _path name city country region coordinates }
  }
}
```

with variables `{ "path": "/content/dam/wknd-shared/en/locations/chamonix-mont-blanc" }`:

```json
{ "data": { "locationByPath": { "item": {
  "_path": "/content/dam/wknd-shared/en/locations/chamonix-mont-blanc",
  "name": "Chamonix-Mont-Blanc", "city": "Chamonix", "country": "France", "region": "Europe",
  "coordinates": { "lat": 45.9237, "lng": 6.8694 }
} } } }
```

An unknown path — or a fragment that is **not published** on Publish — gives `{ "locationByPath": { "item": null } }`. It is **not an error**.

> [!IMPORTANT]
> Language copies live side by side in the DAM (`/content/dam/wknd-shared/en/…`, `/de/…`). Without `_locale: "en"` a *list* returns **every** language. Always scope your lists. (`…ByPath` doesn't need it: the path already contains the language.)

### 3. How content-model fields look in GraphQL

| Content Fragment data type | GraphQL type | How you select it |
| --- | --- | --- |
| Single line text / Enumeration | `String` | `title`, `activity` |
| Multi line text | `MultiFormatString` | **needs a sub-selection**: `description { plaintext }` (also `html`, `markdown`, `json` — Lab 10) |
| Number (integer / fraction) | `Int` / `Float` | `groupSize` / `price` |
| Date and Time | `Date` / `Time` / `Calendar` | `departureDate` (a string in JSON) |
| JSON Object | `JSON` | `coordinates` — a scalar, no sub-selection |
| Fragment Reference | the referenced model's type | **nest**: `location { name country }` |
| Content Reference (image, PDF…) | `Reference` — a **union** | `primaryImage { ... on ImageRef { _dynamicUrl width height } }` |

Two patterns deserve a closer look.

**Fragment reference = just nest.** One model pointing at another is a normal object field. A *selection set is mandatory* for object types, which is why `description` (an object) can't be selected as a bare field:

```graphql
authorList(_locale: "en") {
  items { firstName lastName occupation }
}
```

**Content reference = union.** `Reference` can be an `ImageRef`, a `DocumentRef`, even a fragment type, so GraphQL requires you to say *which* type's fields you want, using an inline fragment. Anything that isn't that type simply comes back as `{}`:

```graphql
authorList(_locale: "en") {
  items {
    firstName
    profilePicture {
      ... on ImageRef { _path _dynamicUrl width height }
    }
  }
}
```

```json
{ "firstName": "Ian",
  "profilePicture": { "_path": "/content/dam/wknd-shared/en/contributors/ian-provo.jpg",
                      "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--139d041f-…/ian-provo.jpg?preferwebp=true",
                      "width": 800, "height": 800 } }
```

### 4. Build queries in GraphiQL, not in your editor

Real AEM ships the **GraphiQL IDE** at `/aem/graphiql.html` and so does the mock (`:4503/aem/graphiql.html`). It is the fastest feedback loop you have:

1. Pick the endpoint (here `wknd-shared`).
2. Open the **Docs** panel (book icon) to browse every type and its fields, or use the **Explorer** panel and click fields together — it writes the query for you.
3. Press ▶ to run it, fix errors, and only then paste it into code.

### 5. HTTP: the request and the (misleading) response

A query is an ordinary `POST` to the endpoint with a JSON body — exactly Lab 01:

```bash
curl -s -X POST http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.json \
  -H "Content-Type: application/json" \
  -d '{"query":"query($p:String!){ locationByPath(_path:$p){ item { name } } }","variables":{"p":"/content/dam/wknd-shared/en/locations/chamonix-mont-blanc"}}'
```

> [!IMPORTANT]
> AEM answers **HTTP 200 even when your query is invalid** and reports the problem in `errors`. `extensions.classification` says what kind: `ValidationError` (the query doesn't match the schema), `InvalidSyntax` (can't be parsed) or `DataFetchingException` (a resolver failed).

```json
{ "errors": [{
  "message": "Cannot query field \"nam\" on type \"LocationModel\". Did you mean \"name\"?",
  "locations": [{ "line": 1, "column": 26 }],
  "extensions": { "classification": "ValidationError" }
}] }
```

A helper that only checks `response.ok` will return `undefined` and your UI will render nothing. Check `errors` *every time*.

### 6. Where do the hosts come from? `aemConfig()`

Never hard-code hosts. [`src/lib/aem/config.ts`](../../lib/aem/config.ts) exposes `aemConfig()`, which reads environment variables and returns `{ publishHost, authorHost, endpoint, configurationName }` (defaults match the mock). Two rules for using it:

- **Call it inside the function**, not at module top level. The tests point the app at a private mock by changing `process.env` after your module loaded.
- The endpoint is a *path*; the host is separate. The full URL is host + endpoint.

### 7. `_dynamicUrl` is relative

Images are delivered by AEM's web-optimized pipeline. The URL in the response has **no host**: `/adobe/dynamicmedia/deliver/dm-aid--<uuid>/<name>.jpg?preferwebp=true`. Your app has to decide which AEM serves it (Publish for visitors). The standard way to resolve a relative URL against a base is the URL constructor:

```ts
new URL("/adobe/x/a.jpg?preferwebp=true", "http://localhost:4503").toString();
// "http://localhost:4503/adobe/x/a.jpg?preferwebp=true"  — path and query string are preserved
```

Forgetting this prefix is the most common bug in AEM headless code reviews — images load from *your* Next.js host and 404.

## The model

```graphql
type AdventureModel {
  _path: ID!
  title: String
  slug: String
  description: MultiFormatString
  activity: String          # Camping | Cycling | Hiking | Rock Climbing | Skiing | Social | Surfing
  difficulty: String        # Beginner | Intermediate | Advanced | Expert
  tripLength: String
  groupSize: Int
  price: Float
  primaryImage: Reference   # union: ImageRef | DocumentRef | … | AdventureModel | …
  location: LocationModel   # fragment reference
  # … see the full schema in GraphiQL (Docs panel)
}
```

### Data shape: `adventureList(_locale: "en", sort: "title ASC")`

```json
{
  "data": {
    "adventureList": {
      "items": [
        {
          "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp",
          "title": "Bali Surf Camp",
          "slug": "bali-surf-camp",
          "activity": "Surfing",
          "price": 1890,
          "tripLength": "6 Days",
          "primaryImage": {
            "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--dce67894-bf0e-57f8-8be6-ce1d79097ee2/bali-surf-camp-hero.jpg?preferwebp=true",
            "width": 2000,
            "height": 1333
          }
        }
      ]
    }
  }
}
```

### Data shape: `adventureByPath(_path: …)`

```json
{
  "data": {
    "adventureByPath": {
      "item": {
        "title": "Bali Surf Camp",
        "difficulty": "Beginner",
        "groupSize": 6,
        "description": { "plaintext": "Six days of warm water, patient coaches and soft-top boards on the reef breaks of Uluwatu.\nNo experience needed — …" },
        "location": { "name": "Uluwatu", "city": "Uluwatu", "country": "Indonesia" }
      }
    }
  }
}
```

The TypeScript shapes are in [types.ts](./types.ts) (`AdventureCard`, `AdventureDetail`).

## Your tasks

Everything is in [aem.ts](./aem.ts). Build the queries in GraphiQL first (concept 4), then copy them in.

### Task 1 — the endpoint URL · `aemGraphQLUrl()`

Return Publish host + endpoint, read from `aemConfig()` **inside the function**: `` `${aemConfig().publishHost}${aemConfig().endpoint}` `` (concept 6).

**Works when:** "builds the publish GraphQL endpoint URL" passes.

### Task 2 — the request helper · `aemGraphQL<TData>(query, variables?)`

Implement it in this order:

1. `fetch(aemGraphQLUrl(), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }) })`.
2. If `!response.ok`, throw an `Error` containing `response.status`.
3. Parse the body as JSON. If `body.errors?.length`, throw an `Error` whose message joins every error as `` `${classification}: ${message}` `` with `"; "` — `classification` is `error.extensions?.classification` (fall back to `"Error"`). Example message: `ValidationError: Cannot query field "nope" on type "AdventureModel".`
4. Return `body.data` typed as `TData`.

You wrote the same thing in Lab 01 for the Countries API; the differences are the URL and the `classification` in the message.

**Works when:** "throws on AEM validation errors even though AEM answers HTTP 200" passes.

### Task 3 — the card list · `ADVENTURE_CARDS_QUERY`, `getAdventureCards()`

Query `adventureList(_locale: "en", sort: "title ASC")` and, inside `items`, select exactly the fields of `AdventureCard` in [types.ts](./types.ts):

| Field(s) | Kind | Selection |
| --- | --- | --- |
| `_path title slug activity price tripLength` | scalars | name them |
| `primaryImage` | union (concept 3) | `primaryImage { ... on ImageRef { _dynamicUrl width height } }` |

Name the operation `AdventureCards`. `getAdventureCards()` calls `aemGraphQL<AdventureCardsData>(ADVENTURE_CARDS_QUERY)` and returns `data.adventureList.items`.

**Works when:** you get 16 cards, the first being *Bali Surf Camp*, and the drafts are absent.

### Task 4 — one adventure · `ADVENTURE_BY_PATH_QUERY`, `getAdventureByPath(path)`

```graphql
query AdventureByPath($path: String!) {
  adventureByPath(_path: $path) {
    item { …everything from Task 3 plus the fields below… }
  }
}
```

Add: `difficulty groupSize`, `description { plaintext }` (object → needs a sub-selection) and `location { name city country }` (fragment reference → nested object). Send `{ path }` as a **variable**. Return `data.adventureByPath.item`, which may be `null`.

**Works when:** the detail test passes **and** both unknown and unpublished paths return `null`.

### Task 5 — absolute image URLs · `toPublishUrl(dynamicUrl)`

Return `new URL(dynamicUrl, aemConfig().publishHost).toString()` (concept 7). The query string must survive untouched.

**Works when:** "prefixes the publish origin" passes and the workspace shows images.

## Acceptance criteria

- `npm test -- 07` passes.
- The workspace shows 16 adventures with images; clicking one shows its details.
- The drafts *Iceland Northern Lights Trek* and *Patagonia Glacier Expedition* do **not** appear (they only exist on Author — Lab 14).

## Stretch goals

- Ask for `description { html markdown json }` and compare the formats (Lab 10 renders `json`).
- Query `_model { title }`, `_id` and `_variations`.
- Fetch the schema as SDL: [endpoint.GQLschema](http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.GQLschema).
- Send a query to `/content/cq:graphql/global/endpoint.json` and read the error — AEM only exposes models of the endpoint's own configuration.
