## Goal

Build an adventure search on top of **AEM's filter grammar** — the part of the AEM GraphQL API you'll write most often, and the one with the most surprises. The UI is a Client Component on **Apollo Client** (Lab 03) that calls AEM Publish directly from the browser.

By the end you will have: a function that turns a search form into an AEM `filter` object, a sort-string builder, one parameterised query, and a cache policy that makes Apollo understand AEM fragments.

## Concepts and tooling

The examples use the **Location** and **Article** models. The tasks use **Adventure**.

### 1. The shape of an AEM filter

Every `…List` and `…Paginated` query takes a `filter` argument whose shape **mirrors the model**: one key per field, each holding a list of *expressions*.

```graphql
locationList(
  _locale: "en"
  filter: {
    country: { _expressions: [{ value: "fr", _operator: CONTAINS, _ignoreCase: true }] }
  }
) { items { name country } }
```

```json
{ "items": [ { "name": "Chamonix-Mont-Blanc", "country": "France" }, { "name": "Le Marais", "country": "France" } ] }
```

Read it from the inside out:

| Piece | Meaning |
| --- | --- |
| `{ value: "fr", _operator: CONTAINS, _ignoreCase: true }` | one **expression**: compare the field to `value` with `_operator` |
| `_expressions: [ … ]` | the field's list of expressions (always a list, even with one entry) |
| `country: { … }` | which field of the model it applies to |

If you omit `_operator`, each type has a **default** (strings: `EQUALS`). That's why a plain `{ value: "France" }` means "equals France".

### 2. Operators depend on the field's type

| Type | Operators (default first) | Value you pass |
| --- | --- | --- |
| String | `EQUALS`, `EQUALS_NOT`, `CONTAINS`, `CONTAINS_NOT` (+ `_ignoreCase: true`) | `"Surfing"` |
| `_path` (ID) | `EQUALS`, `EQUALS_NOT`, `STARTS_WITH` — "everything under this folder" | `"/content/dam/…"` |
| Int / Float | `EQUAL`, `UNEQUAL`, `GREATER`, `GREATER_EQUAL`, `LOWER`, `LOWER_EQUAL` | `2000` (a JSON number) |
| Date / Time / Calendar | `AT`, `NOT_AT`, `BEFORE`, `AT_OR_BEFORE`, `AFTER`, `AT_OR_AFTER` | `"2027-01-01"` (ISO string) |
| Boolean | `EQUALS` | `true` |
| Arrays (tags, multi-value) | add `_apply: AT_LEAST_ONCE \| ALL \| ALL_OR_EMPTY`, or `values: [...]` for an exact match | |

A number example (on `Article`, "reading time of at most six minutes"):

```graphql
articleList(
  _locale: "en"
  filter: { readingTimeMinutes: { _expressions: [{ value: 6, _operator: LOWER_EQUAL }] } }
  sort: "readingTimeMinutes DESC"
) { items { title readingTimeMinutes } }
```

> [!WARNING]
> Using `EQUALS` on a number is the #1 AEM GraphQL validation error. The message names the enum: `Value "EQUALS" does not exist in "IntOperator" enum. Did you mean the enum value "EQUAL" or "UNEQUAL"?` (`FloatOperator` for fractions.) Whenever you see `…does not exist in "…Operator" enum`, you picked the wrong table row above.

### 3. Combining conditions: `_logOp` and "across fields is always AND"

- **Within one field**, `_logOp` combines the expressions of *that field*. Default `AND`; set `OR` for "any of these":

  ```graphql
  locationList(filter: {
    region: { _logOp: OR, _expressions: [{ value: "Europe" }, { value: "Asia" }] }
  }) { items { name region } }
  ```

- **Across fields** the combination is always `AND`. There is no top-level OR between *different* fields; if you need it, send two queries or restructure the model.

Two fields at once = both must match:

```graphql
filter: {
  region:  { _logOp: OR, _expressions: [{ value: "Europe" }, { value: "Asia" }] }   # Europe OR Asia
  country: { _expressions: [{ value: "fr", _operator: CONTAINS, _ignoreCase: true }] } # AND country contains "fr"
}
```

### 4. Filtering through a fragment reference

A fragment-reference field takes the **referenced model's filter**, so you nest one level:

```graphql
articleList(
  _locale: "en"
  filter: { authorFragment: { lastName: { _expressions: [{ value: "Provo" }] } } }
) { items { title authorFragment { lastName } } }
```

Multi-value references (like `relatedAdventures`) use `{ _match: { …filter… }, _apply: AT_LEAST_ONCE }` instead. Nested filters work but can be slow on big repositories.

### 5. Filters as variables

The argument type of `filter` is `<Model>Filter` (`AdventureModelFilter`). Declare it as a variable and hand the whole object over — **one query, many filters**:

```graphql
query LocationSearch($filter: LocationModelFilter, $sort: String) {
  locationList(_locale: "en", filter: $filter, sort: $sort) { items { _path name country } }
}
```

```json
{ "filter": { "country": { "_expressions": [{ "value": "France" }] } }, "sort": "name ASC" }
```

Building that object is plain TypeScript. The one rule that matters: **only add a key when the criterion is set.** `{}` means "no filter". A key holding `undefined` is dropped by `JSON.stringify`, but a key with `_expressions: [{ value: "" }]` is a real condition that matches nothing useful. The hand-written `AdventureModelFilter` type in [`src/lib/aem/filter-types.ts`](../../lib/aem/filter-types.ts) catches typos (Lab 06 shows how to generate it instead).

### 6. Sorting is a string

```graphql
sort: "price DESC, title ASC"        # comma-separated, direction optional (ASC is the default)
sort: "location.country ASC"         # dots reach into a fragment reference
```

Always add a **secondary key** (`title ASC`) when the primary one has duplicates — otherwise the order of equal items is not guaranteed.

### 7. Apollo and AEM: `keyFields: ["_path"]`

Apollo normalizes objects by `__typename` + `id` (Lab 03). **AEM fragments have no `id`** — their identity is `_path`. Unless you say so, Apollo stores AEM fragments *unnormalized* inside their parent query. Tell it:

```ts
new InMemoryCache({
  typePolicies: {
    // → cache key  LocationModel:{"_path":"/content/dam/wknd-shared/en/locations/lake-tahoe"}
    LocationModel: { keyFields: ["_path"] },
  },
});
```

The flip side: once a type has `keyFields: ["_path"]`, **every selection of that type must include `_path`**, or Apollo throws `Missing field '_path' while writing result …`. That includes *nested* objects: select `_path` on the adventure **and** on its `location`. (The image doesn't need it: `ImageRef` isn't given a policy here.)

### 8. Browser → AEM Publish: CORS

This lab's Apollo client calls `http://localhost:4503` from a page on `http://localhost:3000`. Browsers only allow that if Publish answers with `Access-Control-Allow-Origin` for your origin (in real AEM: the CORS OSGi policy; in the mock it's pre-configured). You'll see an `Origin` request header and a CORS response header in DevTools → Network.

> [!NOTE]
> Real Publish tiers usually block ad-hoc `POST` queries at the Dispatcher — that's why production code uses **persisted queries** via `GET` (Lab 11). Ad-hoc POST from the browser is fine for learning.

## Data shape

```graphql
query AdventureSearch($filter: AdventureModelFilter, $sort: String, $locale: String = "en") {
  adventureList(filter: $filter, sort: $sort, _locale: $locale) { items { … } }
}
```

Variables (what your `buildAdventureFilter` + `buildSort` produce):

```json
{
  "filter": {
    "activity": { "_logOp": "OR", "_expressions": [{ "value": "Skiing" }] },
    "price": { "_expressions": [{ "value": 3000, "_operator": "LOWER_EQUAL" }] }
  },
  "sort": "price ASC, title ASC"
}
```

Response:

```json
{
  "data": {
    "adventureList": {
      "items": [
        {
          "_path": "/content/dam/wknd-shared/en/adventures/tahoe-skiing/tahoe-skiing",
          "title": "Tahoe Skiing",
          "activity": "Skiing",
          "difficulty": "Intermediate",
          "price": 1240,
          "groupSize": 10,
          "departureDate": "2027-01-02",
          "primaryImage": { "_path": "/content/dam/…/tahoe-skiing-hero.jpg", "_dynamicUrl": "/adobe/dynamicmedia/deliver/…" },
          "location": { "_path": "/content/dam/wknd-shared/en/locations/lake-tahoe", "city": "South Lake Tahoe", "country": "United States" }
        },
        { "title": "Downhill Skiing Wyoming", "price": 2650, "…": "…" }
      ]
    }
  }
}
```

## Your tasks

### Task 1 — the filter builder · [filters.ts](./filters.ts) → `buildAdventureFilter(criteria)`

Input: `AdventureSearchCriteria` ([types.ts](./types.ts)). Output: an `AdventureModelFilter`. The test compares with `toEqual`, so produce **exactly** these shapes and nothing else:

| Criterion (when set) | Key | Value to produce |
| --- | --- | --- |
| `search: "camp"` | `title` | `{ _expressions: [{ value: "camp", _operator: "CONTAINS", _ignoreCase: true }] }` |
| `activities: ["Surfing","Skiing"]` (non-empty) | `activity` | `{ _logOp: "OR", _expressions: [{ value: "Surfing" }, { value: "Skiing" }] }` — one expression per activity |
| `difficulty: "Beginner"` | `difficulty` | `{ _expressions: [{ value: "Beginner" }] }` |
| `maxPrice: 2000` | `price` | `{ _expressions: [{ value: 2000, _operator: "LOWER_EQUAL" }] }` |
| `minGroupSize: 6` | `groupSize` | `{ _expressions: [{ value: 6, _operator: "GREATER_EQUAL" }] }` |
| `country: "France"` | `location` | `{ country: { _expressions: [{ value: "France" }] } }` — nested (concept 4) |
| `departureAfter: "2027-01-01"` | `departureDate` | `{ _expressions: [{ value: "2027-01-01", _operator: "AT_OR_AFTER" }] }` |

Rules: build an empty object, add a key only for criteria that are set (watch out: `maxPrice: 0` is a real value, an empty string is not), return it. With no criteria the result is `{}`.

**Works when:** both `buildAdventureFilter` tests pass.

### Task 2 — the sort builder · [filters.ts](./filters.ts) → `buildSort(key)`

| `key` | Return |
| --- | --- |
| `"title"` | `"title ASC"` |
| `"price-asc"` | `"price ASC, title ASC"` |
| `"price-desc"` | `"price DESC, title ASC"` |
| `"departure"` | `"departureDate ASC"` |

A `switch` or a lookup object both work.

### Task 3 — the query · [queries.ts](./queries.ts) → `ADVENTURE_SEARCH_QUERY`

Replace the placeholder (keep the `TypedDocumentNode` annotation):

```graphql
query AdventureSearch($filter: AdventureModelFilter, $sort: String, $locale: String = "en") {
  adventureList(filter: $filter, sort: $sort, _locale: $locale) {
    items {
      …
    }
  }
}
```

Fill `items` with the fields of `AdventureHit` ([types.ts](./types.ts)): `_path title activity difficulty price groupSize departureDate`, `primaryImage { … on ImageRef { _path _dynamicUrl } }` (union — Lab 07), and `location { _path city country }`. **`_path` on the adventure *and* on the location** (concept 7).

### Task 4 — the cache policy · [queries.ts](./queries.ts) → `aemTypePolicies`

`{ AdventureModel: { keyFields: ["_path"] }, LocationModel: { keyFields: ["_path"] } }`.

**Works when:** the query test and the `aemTypePolicies` test pass.

### Task 5 — wire up the hook · [AdventureSearch.tsx](./AdventureSearch.tsx) → `AdventureSearch`

Replace the `todo(...)` with `const { data, previousData, loading, error } = useQuery(ADVENTURE_SEARCH_QUERY, { variables });` — `useQuery` as a value from `@apollo/client/react`, the query from `./queries`. Delete the cast.

**Works when:** the workspace lists adventures and re-queries on every form change.

## Acceptance criteria

- `npm test -- 08` passes.
- In the workspace: *Skiing* + max price *3000* + sort *Price ↑* → Tahoe Skiing, Downhill Skiing Wyoming. Country *France* → two results.
- Open the "Variables sent to AEM" panel: the JSON matches the grammar above.
- DevTools → Network shows `POST localhost:4503/content/cq:graphql/wknd-shared/endpoint.json` with an `Origin: http://localhost:3000` header and a CORS `Access-Control-Allow-Origin` response header.

## Stretch goals

- Filter by tag: `tags: { _expressions: [{ value: "wknd-shared:season/winter", _apply: AT_LEAST_ONCE }] }`.
- Find adventures under a folder with `_path: { _expressions: [{ value: "/content/dam/wknd-shared/en/adventures/c", _operator: STARTS_WITH }] }`.
- Sort by a nested field: `sort: "location.country ASC, title ASC"`.
- Make a mistake on purpose (`_operator: EQUALS` on `price`) and read the validation error in the UI.
