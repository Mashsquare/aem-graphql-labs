## Walkthrough

### Build the filter as data

```ts
const filter: AdventureModelFilter = {};
if (criteria.activities.length) {
  filter.activity = { _logOp: "OR", _expressions: criteria.activities.map((value) => ({ value })) };
}
if (criteria.maxPrice !== undefined) {
  filter.price = { _expressions: [{ value: criteria.maxPrice, _operator: "LOWER_EQUAL" }] };
}
if (criteria.country) {
  filter.location = { country: { _expressions: [{ value: criteria.country }] } };
}
```

- A pure function from UI state to filter object is trivial to unit test — and the same function works server-side, client-side or to build persisted-query variables.
- **One document, many filters.** Passing `$filter: AdventureModelFilter` keeps the query text constant. Building query strings with interpolated filters breaks caching, breaks persisted queries and invites injection bugs.
- `maxPrice !== undefined`, not `if (criteria.maxPrice)` — `0` is a valid value.

### OR within a field, AND across fields

There is no way to express "activity is Skiing **or** price < 500" in one AEM filter. If you need it, run two queries (or one query with two aliased lists) and merge client-side.

### Nested filters are convenient — and not free

Filtering through `location { country }` makes AEM resolve the referenced fragment for every candidate. Adobe's docs warn that nested filters can be slow on large repositories. Alternatives: denormalize (store `country` on the adventure) or use tags.

### keyFields for AEM

```ts
export const aemTypePolicies: TypePolicies = {
  AdventureModel: { keyFields: ["_path"] },
  LocationModel: { keyFields: ["_path"] },
};
```

With this, `AdventureModel:{"_path":"/content/dam/…/tahoe-skiing"}` is stored once no matter how many lists contain it.

> [!WARNING]
> Two AEM-specific traps:
> - **Variations** share `_path`. If you query `includeVariations: true` (Lab 12), master and `summer` collapse into one cache entry. Use `keyFields: ["_path", "_variation"]` (and always select `_variation`) in that case.
> - **Images** — don't normalize `ImageRef` by `_path`: the same asset requested with different `_assetTransform`s has different `_dynamicUrl`s.

### CORS

The browser calls `localhost:4503` from `localhost:3000` — a cross-origin request. The mock answers the preflight with `Access-Control-Allow-Origin: http://localhost:3000`. On AEM as a Cloud Service that's an OSGi configuration (`com.adobe.granite.cors.impl.CORSPolicyImpl~<site>.cfg.json`) deployed with your code. Many teams avoid browser → AEM calls entirely and fetch on the server (Server Components / route handlers), which also hides the AEM host.
