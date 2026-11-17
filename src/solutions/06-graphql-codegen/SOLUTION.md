## Walkthrough

### Variables typed by the schema

```graphql
query AdventureTeasers($filter: AdventureModelFilter, $locale: String = "en") {
  adventureList(filter: $filter, _locale: $locale, sort: "title ASC") { items { ...AdventureTeaser } }
}
```

Passing the **whole filter as one variable** is the idiomatic way to build dynamic AEM filters: the document stays constant (good for persisted queries, Lab 11) and the generated `AdventureModelFilter` type checks every key and operator.

```ts
export function teaserFilter(difficulty?: string): AdventureModelFilter | undefined {
  if (!difficulty) return undefined;
  return { difficulty: { _expressions: [{ value: difficulty }] } };
}
```

### No generics at the call site

```ts
const data = await request(aemEndpoint(), adventureTeasersQuery, { filter: teaserFilter(difficulty) });
// data: AdventureTeasersQuery — variables checked against AdventureTeasersQueryVariables
```

### Fragment masking

```tsx
export function AdventureTeaser(props: { adventure: FragmentType<typeof adventureTeaserFragment> }) {
  const adventure = getFragmentData(adventureTeaserFragment, props.adventure);
```

At runtime `getFragmentData` just returns its input — masking is a *type-level* contract. The parent passes opaque references; each component reads only what it declared. Adding `difficulty` to the fragment changed the request (the fragment is inlined into the query document) without editing the query.

### __typename on unions

`primaryImage` is the `Reference` union. Selecting `__typename` lets TypeScript narrow:

```ts
const image = adventure.primaryImage?.__typename === "ImageRef" ? adventure.primaryImage : null;
```

Without it the field is a union of shapes you can't tell apart — at runtime *and* in types.

## Notes

- The warning `fragment with name AdventureTeaser already exists` during codegen comes from graphql-tag seeing the lab *and* the solution fragment in one run. Harmless here; in a real app keep fragment names unique.
- Commit the generated `gql/` folder (as this repo does) or generate in CI before `tsc` — both are common. Never edit it by hand.
- Codegen can also generate **persisted query hashes/manifests** (`presetConfig.persistedDocuments`) — the generic GraphQL take on what AEM does with named persisted queries.
