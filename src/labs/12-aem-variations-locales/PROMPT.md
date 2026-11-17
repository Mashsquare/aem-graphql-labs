## Goal

The same Content Fragment can exist in several **variations** (seasonal copy, channel-specific text) and several **language copies**. You'll query both, understand the silent fallback rules, and read **fragment metadata** that isn't part of the model.

## Concepts and tooling

The examples use the **Article** model, which has a `teaser` variation and German copies in the mock. The tasks use **Adventure**.

### 1. Variations: one fragment, several versions of its content

Every fragment has a **master** and optional named **variations**, created by authors in the Content Fragment editor ("Bali in 60 seconds" is a short version of a long article, say). A variation overrides *some* fields; every field it doesn't override is inherited from master.

You select a variation with the `variation` argument and find out what you got with two helper fields:

| Argument / field | Effect |
| --- | --- |
| `variation: "teaser"` (on `…ByPath`, `…List`, `…Paginated`) | return that variation — **or master when it doesn't exist** |
| `_variation` | which variation you actually got (`"master"` after a fallback) |
| `_variations` | names of all variations of this fragment (master excluded) |
| `includeVariations: true` (`…List`/`…Paginated`) | master *and* every variation as **separate items** |

```graphql
query ArticleVariation($slug: String!, $variation: String) {
  articleList(_locale: "en", variation: $variation, filter: { slug: { _expressions: [{ value: $slug }] } }) {
    items { _variation _variations title }
  }
}
```

| Variables | Response item |
| --- | --- |
| `{ "slug": "the-surfers-guide-to-bali" }` (no variation) | `{ "_variation": "master", "_variations": ["teaser"], "title": "The Surfer's Guide to Bali" }` |
| `{ "slug": "the-surfers-guide-to-bali", "variation": "teaser" }` | `{ "_variation": "teaser", "_variations": ["teaser"], "title": "Bali in 60 seconds" }` |
| `{ "slug": "packing-light-the-wknd-way", "variation": "teaser" }` | `{ "_variation": "master", "_variations": [], "title": "Packing Light the WKND Way" }` ← **no such variation: silent fallback, no error** |

> [!WARNING]
> The silent fallback is by design (a site can ask for "the summer version" everywhere and get master where none exists), but it means **you must read `_variation`** whenever it matters. A component that renders a "summer deal" banner because it asked for `summer` is wrong when it received master.

**`includeVariations: true`** returns every version as its own list item. Note that they share the **same `_path`**; `_variation` is what tells them apart:

```json
{ "items": [
  { "_path": "…/the-surfers-guide-to-bali", "_variation": "master", "title": "The Surfer's Guide to Bali" },
  { "_path": "…/the-surfers-guide-to-bali", "_variation": "teaser", "title": "Bali in 60 seconds" }
] }
```

So a React `key`, a cache key or an Apollo `keyFields` for these items needs **`_path` + `_variation`**, not `_path` alone.

### 2. Language copies: `_locale`

AEM translation creates parallel folder trees: `/content/dam/wknd-shared/en/…` and `/content/dam/wknd-shared/de/…`. The `_locale` argument restricts a **list** to one tree:

```graphql
articleList(_locale: "de") { items { _path title } }
```

```json
{ "items": [
  { "_path": "/content/dam/wknd-shared/de/magazine/ski-touring-for-beginners/ski-touring-for-beginners", "title": "Skitouren für Einsteiger" },
  { "_path": "/content/dam/wknd-shared/de/magazine/the-surfers-guide-to-bali/the-surfers-guide-to-bali", "title": "Der Surf-Guide für Bali" }
] }
```

Points to remember:

- Only some content has translations. A missing copy is **not an error** and there is **no automatic fallback**: you simply get no item (an empty list; `null` when you take `items[0] ?? null`). Showing the English version instead is your code's decision.
- `_locale` and `variation` combine: *the German teaser* is `_locale: "de", variation: "teaser"`.
- `_locale` is how you scope a list; without it a list returns **every** language.

### 3. Metadata: information *about* the fragment

Some information isn't part of the model: which model it was created from, its tags, who modified it and when it was last published. AEM exposes it through underscore fields:

```graphql
articleByPath(_path: $path) {
  item {
    _model { _path title }                  # which Content Fragment Model
    _tags                                   # cq:tags on the fragment, as a list of tag ids
    _metadata {
      stringMetadata      { name value }    # title, description, cq:lastModifiedBy, cq:model …
      stringArrayMetadata { name value }    # cq:tags …
      calendarMetadata    { name value }    # jcr:created, cq:lastModified, cq:lastReplicated
      # also int/float/boolean (+ Array) variants
    }
  }
}
```

```json
"_metadata": {
  "stringMetadata": [ { "name": "title", "value": "The Surfer's Guide to Bali" }, { "name": "cq:lastModifiedBy", "value": "admin" } ],
  "calendarMetadata": [ { "name": "jcr:created", "value": "2026-03-14T08:00:00.000Z" }, { "name": "cq:lastReplicated", "value": "2026-03-14T08:00:00.000Z" } ]
}
```

Why the odd `{ name, value }` lists? GraphQL has no free-form map type, and metadata values have *different types*. AEM therefore groups metadata by value type and returns each group as a list of name/value pairs. To read one value you must **search the lists by `name`** — which is what Task 5 is about. A given name lives in exactly one list: dates in `calendarMetadata`, tag arrays in `stringArrayMetadata`, and so on.

Typical uses: "last updated" labels (`cq:lastModified`), `lastmod` in a sitemap, and debugging ("is this the version I published?" → `cq:lastReplicated`).

### 4. Optional variables

`$variation: String` (nullable, no `!`) means the variable may be omitted. In TypeScript pass `undefined` and `JSON.stringify` drops the key entirely, so AEM receives no `variation` and returns master. Declare variables nullable when the argument is optional; make them `!` only when your query is meaningless without them (`$slug`).

### 5. Caching: what must be in the key?

Content now depends on **three** things: which fragment, which variation, which locale. Every cache you put in front must include all three:

| Cache | Where the key comes from |
| --- | --- |
| Next.js `"use cache"` | the **function arguments** (`getAdventureVariation(slug, variation, locale)`) — so pass them as arguments, don't read them from somewhere else |
| Apollo | `keyFields: ["_path", "_variation"]` |
| TanStack Query | `["adventure", slug, variation, locale]` |
| Persisted queries / CDN | the matrix parameters (`;variation=summer;locale=de`) |

## Data shapes

### `adventureList(variation: "summer", filter: { slug: "beervana-portland" })` — no such variation

```json
{ "data": { "adventureList": { "items": [
  { "_variation": "master", "_variations": [], "title": "Beervana in Portland", "price": 149 }
] } } }
```

### `includeVariations: true` for `bali-surf-camp`

```json
{ "data": { "adventureList": { "items": [
  { "_variation": "master", "title": "Bali Surf Camp", "price": 1890 },
  { "_variation": "summer", "title": "Bali Surf Camp — Summer Swell", "price": 1690 }
] } } }
```

### `_metadata`

```json
"_metadata": {
  "stringMetadata": [
    { "name": "title", "value": "Bali Surf Camp" },
    { "name": "cq:lastModifiedBy", "value": "admin" },
    { "name": "cq:model", "value": "/conf/wknd-shared/settings/dam/cfm/models/adventure" }
  ],
  "stringArrayMetadata": [{ "name": "cq:tags", "value": ["wknd-shared:activity/surfing", "wknd-shared:region/asia", "wknd-shared:season/summer"] }],
  "calendarMetadata": [
    { "name": "jcr:created", "value": "2026-04-18T10:15:00.000Z" },
    { "name": "cq:lastModified", "value": "2026-04-18T10:15:00.000Z" },
    { "name": "cq:lastReplicated", "value": "2026-04-18T10:15:00.000Z" }
  ]
}
```

The result types — `AdventureVariation`, `VariationRow`, `LocalizedAdventure`, `AdventureMetadata`, `TypedMetaData` — are in [types.ts](./types.ts).

## Your tasks

All in [data.ts](./data.ts) — the workspace UI is provided. Every function uses `aemQuery` from `@/lib/aem/client` (it POSTs and throws on `errors`). Try each query in GraphiQL first.

### Task 1 — one adventure, in a variation and a language · `ADVENTURE_VARIATION_QUERY`, `getAdventureVariation(slug, variation?, locale = "en")`

```graphql
query AdventureVariation($slug: String!, $variation: String, $locale: String!) {
  adventureList(_locale: $locale, variation: $variation, filter: { slug: { _expressions: [{ value: $slug }] } }) {
    items { … }
  }
}
```

Select what `AdventureVariation` needs: `_path _variation _variations title price tripLength description { plaintext }`. Send `{ slug, variation, locale }` (an undefined `variation` simply isn't sent). Return `items[0] ?? null`.

**Works when** (the tests):

| Call | Expected |
| --- | --- |
| `("bali-surf-camp", "summer")` | `_variation: "summer"`, title `Bali Surf Camp — Summer Swell`, price 1690 |
| `("beervana-portland", "summer")` | `_variation: "master"`, price 149, `_variations: []` |
| `("bali-surf-camp", "summer", "de")` | title `Surfcamp auf Bali — Sommer-Swell` |
| `("beervana-portland", undefined, "de")` | `null` (no German copy) |

### Task 2 — master and all variations · `ALL_VARIATIONS_QUERY`, `getAllVariations(slug)`

`query AllVariations($slug: String!)` with `adventureList(_locale: "en", includeVariations: true, filter: <slug filter>)`, selecting **only** `_variation title price` — the test compares with `toEqual`, so extra fields would fail it. Return `items`.

**Works when:** `getAllVariations("bali-surf-camp")` returns master (price 1890) then `summer` (price 1690).

### Task 3 — one language copy · `LOCALIZED_ADVENTURES_QUERY`, `getLocalizedAdventures(locale)`

`query LocalizedAdventures($locale: String!)` with `adventureList(_locale: $locale, sort: "title ASC")`, selecting `_path slug title tripLength`. Return `items`.

**Works when:** `"de"` returns 4 adventures (Radfahren in der Toskana, Skitouren am Mont Blanc, Surfcamp auf Bali, Weinprobe im Napa Valley), all under `/content/dam/wknd-shared/de/`, and `"en"` returns 16.

### Task 4 — fragment-level information · `ADVENTURE_METADATA_QUERY`, `getAdventureMetadata(path)`

`query AdventureMetadata($path: String!)` with `adventureByPath(_path: $path) { item { … } }`, selecting `_path`, `_model { _path title }`, `_tags` and the three metadata lists from concept 3 (`stringMetadata`, `stringArrayMetadata`, `calendarMetadata`, each `{ name value }`). Return `item` (possibly `null`).

### Task 5 — read one value · `metadataValue(metadata, name)`

Search `metadata.stringMetadata`, then `metadata.stringArrayMetadata`, then `metadata.calendarMetadata` for an entry whose `name` equals `name`; return that entry's `value`. If none matches return `undefined`. A `for … of` over the three lists with `Array.prototype.find` is enough.

**Works when:**

| Call | Result |
| --- | --- |
| `metadataValue(m, "title")` | `"Bali Surf Camp"` |
| `metadataValue(m, "cq:tags")` | the same array as `_tags` |
| `metadataValue(m, "cq:lastReplicated")` | an ISO timestamp (`2026-…T…`) |
| `metadataValue(m, "does-not-exist")` | `undefined` |

## Acceptance criteria

- `npm test -- 12` passes.
- In the workspace, *beervana-portland* + *summer* shows the warning badge "got _variation: master".
- Switching to `de` shows the German title for Bali and "not available" for Beervana.

## Stretch goals

- Add a `$variation` variable to the persisted query `adventure-by-slug` call (it already supports one) and render a seasonal campaign banner when `_variation !== "master"`.
- Try `includeVariations: true` together with a `_variation` filter and read the error.
- Think about caching: which cache keys must include the variation and the locale? (Next.js: function arguments; Apollo: `keyFields: ["_path", "_variation"]`.)
