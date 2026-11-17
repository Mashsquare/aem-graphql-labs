## Walkthrough

### One query, the whole graph

```graphql
articleList(_locale: "en", filter: { slug: { _expressions: [{ value: $slug }] } }) {
  items {
    main { json }
    authorFragment { firstName lastName profilePicture { ... on ImageRef { _dynamicUrl } } }
    relatedAdventures { _path title slug price }
  }
  _references {
    __typename
    ... on ImageRef { _path _dynamicUrl width height }
    ... on AdventureModel { _path title slug }
  }
}
```

Fetching references in the same request avoids N+1 round trips. `_references` is especially important for rich text: the JSON tree only stores **paths**, so without `_references` you'd have to issue a query per inline image to get its delivery URL.

> [!NOTE]
> Querying by `slug` with `…List` (not `…ByPath`) is the WKND pattern: URLs contain slugs, not repository paths. Remember `_locale`, or the German copy with the same slug is returned too.

### The renderer

```tsx
function renderNode(node, references, key) {
  switch (node.nodeType) {
    case "paragraph": return <p key={key}>{children()}</p>;
    case "header": { const Tag = node.style; return <Tag key={key}>{children()}</Tag>; }
    case "text": return <span key={key}>{wrapText(node)}</span>;
    case "reference":
      if ("path" in node.data) { /* look up ImageRef by path → <img> */ }
      /* else: fragment link → look up by href → app URL from slug */
    default: /* render children if any — never throw */
  }
}
```

Key decisions:

- **Lookup map first** (`Map<_path, reference>`) so each reference resolves in O(1).
- **Fragment links become app URLs.** The node's `href` is a DAM path (`/content/dam/…`) which means nothing to visitors. Resolve it to the fragment, then build `/adventures/<slug>` (or whatever your routing is).
- **Images use `_dynamicUrl`**, not the DAM path, so they get web-optimized delivery (Lab 13).
- **Unknown nodes degrade.** A new RTE plugin on the authoring side must not take your site down.
- JSX escapes text automatically — no XSS risk, unlike `html` + `dangerouslySetInnerHTML`.

A production-ready variant of this renderer lives in [`src/lib/aem/rich-text.tsx`](/labs/15-aem-capstone) and is used by the capstone.

## Real-world notes

- Adobe's tutorials show the same pattern (a node-type map + recursion) for the WKND React app.
- If editors use the AEM **Universal Editor** for visual editing, you'll additionally add `data-aue-*` attributes around rendered fields so the editor can map DOM nodes back to fragment properties.
