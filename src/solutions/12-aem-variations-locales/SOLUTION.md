## Walkthrough

### Variation with fallback

```graphql
adventureList(_locale: $locale, variation: $variation, filter: { slug: { _expressions: [{ value: $slug }] } }) {
  items { _variation _variations title price }
}
```

`$variation` is optional: `undefined` is dropped from the variables JSON and AEM returns master. Always select `_variation` when you request one — it's the only way to notice the fallback. A campaign page that silently shows master prices because an author forgot to create the `summer` variation is a classic production incident.

### includeVariations

Useful for editorial tooling, previews of all variants and A/B setups. Every variation is its own item with the **same `_path`**, which matters for caches that key by `_path` (Apollo) — use `[_path, _variation]` there.

### Locales

`_locale` is a filter over the folder structure. Combine it with everything else (`variation`, `filter`, `sort`). There is no automatic fallback from `de` to `en` — if the German copy doesn't exist, you get nothing. If your site needs fallback, query `de` first and `en` for the missing slugs.

### Metadata

```ts
export function metadataValue(metadata: TypedMetaData, name: string) {
  const entries = [...metadata.stringMetadata, ...metadata.stringArrayMetadata, ...metadata.calendarMetadata];
  return entries.find((entry) => entry.name === name)?.value;
}
```

Metadata is a list of name/value pairs per type, so a tiny lookup helper keeps components readable. Typical uses: "last updated" dates, SEO titles/descriptions maintained in asset metadata, tags for faceting.

## Real-world notes

- On AEM as a Cloud Service, metadata values depend on the metadata schema of your DAM folders; `cq:lastReplicated` exists only for published content.
- Tags (`_tags`) are tag IDs (`namespace:path`). Displaying them needs the tag titles — those come from AEM's tagging API, not from GraphQL.
