## Endpoints

| What | AEM as a Cloud Service | Mock |
| --- | --- | --- |
| GraphQL (ad-hoc, POST) | `/content/cq:graphql/<config>/endpoint.json` (also `/content/_cq_graphql/…`) | same, on `:4502` / `:4503` |
| Schema as SDL | `/content/cq:graphql/<config>/endpoint.GQLschema` | same |
| GraphiQL IDE | `/aem/graphiql.html` (Author) | same (both tiers) |
| Persist a query | `PUT` (create) / `POST` (update) `/graphql/persist.json/<config>/<name>` — Author | same |
| Run a persisted query | `GET /graphql/execute.json/<config>/<name>;var=value` | same |
| List persisted queries | `GET /graphql/list.json` | same (simplified shape) |
| Publish (replicate) | content package, GraphiQL "Publish", `POST /bin/replicate.json` | `POST /bin/replicate.json`, `/mock/console` |

Hosts: Author `https://author-p<program>-e<env>.adobeaemcloud.com`, Publish `https://publish-p<program>-e<env>.adobeaemcloud.com`. Local AEM SDK: Author `localhost:4502`, Publish `localhost:4503` — the mock uses the same ports.

## Models become a schema

```graphql
# Content Fragment Model "adventure" in configuration "wknd-shared"
type AdventureModel { _path: ID!  _id: ID!  _variation: String  _variations: [String]!  _model: ModelInfo!  _metadata: TypedMetaData!  _tags: [String]  title: String  … }

type Query {
  adventureByPath(_path: String!, variation: String, _assetTransform: AssetTransform): AdventureModelResult!     # { item, _references }
  adventureList(filter, sort, offset, limit, _locale, variation, includeVariations, _assetTransform): AdventureModelResults!   # { items, _references }
  adventurePaginated(filter, sort, first, after, _locale, variation, includeVariations, _assetTransform): AdventureModelConnection!  # { edges { cursor node }, pageInfo }
}
```

| CF data type | GraphQL type | Query it like |
| --- | --- | --- |
| Single line text, Enumeration | `String` / `[String]` | `title` |
| Multi line text | `MultiFormatString` | `description { html plaintext markdown json }` |
| Number | `Int` / `Float` | `price` |
| Boolean | `Boolean` | `featured` |
| Date and Time | `Date` / `Time` / `Calendar` | `departureDate` |
| Tags | `[String]` | `tags` |
| Content Reference | `Reference` (union) | `primaryImage { ... on ImageRef { _dynamicUrl width height } }` |
| Fragment Reference | the model type, or `AllFragmentModels` when several models are allowed | `location { name country }` |
| JSON Object | `JSON` | `coordinates` |

## Filtering

```graphql
adventureList(filter: {
  title:    { _expressions: [{ value: "camp", _operator: CONTAINS, _ignoreCase: true }] }
  activity: { _logOp: OR, _expressions: [{ value: "Surfing" }, { value: "Skiing" }] }
  price:    { _expressions: [{ value: 2000, _operator: LOWER_EQUAL }] }
  departureDate: { _expressions: [{ value: "2027-01-01", _operator: AT_OR_AFTER }] }
  tags:     { _expressions: [{ value: "wknd-shared:season/winter", _apply: AT_LEAST_ONCE }] }
  _path:    { _expressions: [{ value: "/content/dam/wknd-shared/en/adventures/c", _operator: STARTS_WITH }] }
  location: { country: { _expressions: [{ value: "France" }] } }          # single fragment reference
}) { items { title } }

articleList(filter: {
  relatedAdventures: { _match: { activity: { _expressions: [{ value: "Skiing" }] } }, _apply: AT_LEAST_ONCE }   # multi reference
}) { items { title } }
```

| Type | Operators (default first) |
| --- | --- |
| String | `EQUALS`, `EQUALS_NOT`, `CONTAINS`, `CONTAINS_NOT` (+ `_ignoreCase`) |
| ID (`_path`) | `EQUALS`, `EQUALS_NOT`, `STARTS_WITH` |
| Int / Float | `EQUAL`, `UNEQUAL`, `GREATER`, `GREATER_EQUAL`, `LOWER`, `LOWER_EQUAL` (Float: `_sensitiveness`) |
| Boolean | `EQUALS` |
| Date / Time / Calendar | `AT`, `NOT_AT`, `BEFORE`, `AT_OR_BEFORE`, `AFTER`, `AT_OR_AFTER` |
| Arrays | `_apply: AT_LEAST_ONCE` (default), `ALL`, `ALL_OR_EMPTY`; `values: [...]` = exact match |

- `_logOp` (default `AND`) combines the expressions of **one** field. Different fields are always ANDed.
- Nested filters work but can be slow on big repositories.

## Sorting & paging

```graphql
adventureList(sort: "price DESC, title ASC", offset: 20, limit: 10)          # no total count — fetch limit + 1
adventurePaginated(sort: "title", first: 10, after: "<endCursor>") {          # first: default 50, max 100
  edges { cursor node { title } }
  pageInfo { endCursor hasNextPage }
}
```

Nested sort: `sort: "location.country"`. Keep `sort`/`filter`/`_locale` identical across pages.

## Variations, locales, metadata

```graphql
adventureList(variation: "summer")          # falls back to master silently — check _variation
adventureList(includeVariations: true)       # master + every variation as items (same _path!)
adventureList(_locale: "de")                 # /content/dam/<site>/de/… only
item { _variation _variations _model { title } _tags
       _metadata { stringMetadata { name value } calendarMetadata { name value } } }
```

## References & rich text

```graphql
articleList(filter: …) {
  items { main { json } authorFragment { firstName } relatedAdventures { slug } }
  _references { __typename ... on ImageRef { _path _dynamicUrl } ... on AdventureModel { _path slug } }
}
```

Rich text JSON nodes: `paragraph`, `header` (`style: "h2"`), `text` (`format.variants: ["bold"|"italic"|"underline"]`), `link` (`data.href`, `data.target`), `unordered-list`/`ordered-list`/`list-item`, `reference` (`data.path` for assets, `data.href` + `type: "fragment"` for fragments). Render recursively; ignore unknown nodes gracefully.

## Images

```graphql
adventureList(_assetTransform: { format: WEBP, quality: 70, width: 800, preferWebp: true }) {
  items { primaryImage { ... on ImageRef { _dynamicUrl _publishUrl _authorUrl width height mimeType } } }
}
```

`_dynamicUrl` is **relative** (`/adobe/dynamicmedia/deliver/dm-aid--<uuid>/<name>.<ext>?…`) — prefix the Publish host. Adjust `width`/`quality` in the URL for `srcset`.

## Persisted queries

```bash
# create (Author)
curl -u admin:admin -X PUT "http://localhost:4502/graphql/persist.json/wknd-shared/adventure-teasers" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ adventureList { items { title } } }", "cache-control": { "max-age": 300 } }'
# publish (Author -> Publish)
curl -u admin:admin -X POST http://localhost:4502/bin/replicate.json -F cmd=activate \
  -F path=/conf/wknd-shared/settings/graphql/persistentQueries/adventure-teasers
# run (Publish)
curl "http://localhost:4503/graphql/execute.json/wknd-shared/adventure-by-slug;slug=bali-surf-camp"
```

Default cache headers (AEMaaCS): `Cache-Control: max-age=60`; `Surrogate-Control: max-age=7200` on Publish (`60` on Author), `stale-while-revalidate=86400`, `stale-if-error=86400`. Override per query (`cache-control`, `surrogate-control`), via Cloud Manager variables or OSGi.

> [!TIP]
> Git Bash on Windows rewrites arguments that start with `/` (like `path=/conf/...`). Prefix the command with `MSYS_NO_PATHCONV=1`, or use PowerShell with `curl.exe`.

## Errors

AEM (graphql-java) returns **HTTP 200** with `errors[].extensions.classification`: `InvalidSyntax`, `ValidationError`, `DataFetchingException`. Always check `errors`. Unknown or unpublished paths return `item: null`, not an error.

## Security & environments

- Publish: anonymous; CORS must allow your site's origin (OSGi `com.adobe.granite.cors.impl.CORSPolicyImpl`). Ad-hoc POST queries are blocked by the Dispatcher by default — use persisted queries.
- Author: always authenticated (developer token / service credentials on AEMaaCS, `admin:admin` on the local SDK). Call it only from the server.
- Put hosts and credentials in environment variables; never ship Author credentials to the browser.
