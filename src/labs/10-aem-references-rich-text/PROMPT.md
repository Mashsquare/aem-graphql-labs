## Goal

Real AEM content is a graph: articles reference authors, adventures and images, and **rich text** fields contain inline images and links to other fragments. You'll query references at every level and write the component every AEM headless project needs: a safe, recursive **rich text renderer**.

## Concepts and tooling

The examples use the **Author** model (bio, profile picture). The tasks use **Article**.

### 1. Four ways content points at other content

| Where | Example field | How you query it |
| --- | --- | --- |
| Fragment reference (single model) | `Article.authorFragment: AuthorModel` | select fields directly: `authorFragment { firstName lastName }` |
| Fragment reference (multi-value) | `Article.relatedAdventures: [AdventureModel]` | same, but you get an **array** |
| Content reference (DAM asset) | `Author.profilePicture: Reference` | union → `profilePicture { ... on ImageRef { _dynamicUrl } }` (Lab 07) |
| Inline in rich text | an image or fragment link inside `Article.main` | the node only carries a **path** → look it up in `_references` |

The first three are ordinary nested selections: ask for what you need, to any depth, in the same query. The fourth is the interesting one.

### 2. Multi line text comes in four formats

A multi line text field is an object — you choose its representation by what you select:

```graphql
authorList(_locale: "en", limit: 1) {
  items {
    bio {
      plaintext   # the text without markup — excerpts, meta descriptions, search
      html        # ready-made HTML
      markdown
      json        # a node tree you render yourself
    }
  }
}
```

| Format | Use it for | Catch |
| --- | --- | --- |
| `plaintext` | excerpts, `<meta>`, search | no formatting |
| `html` | quick prototypes | needs `dangerouslySetInnerHTML` + sanitising; links and images point at DAM paths, not at your site |
| `markdown` | if you already have a markdown renderer | same link/image problem |
| `json` | production: you control every element | you have to write the renderer (this lab) |

### 3. The `json` format: a tree of nodes

```json
[
  { "nodeType": "paragraph", "content": [
      { "nodeType": "text", "value": "Bali has a wave for everyone, but " },
      { "nodeType": "text", "value": "not every wave is for everyone", "format": { "variants": ["bold"] } }
  ]},
  { "nodeType": "header", "style": "h2", "content": [{ "nodeType": "text", "value": "When to go" }] },
  { "nodeType": "reference", "data": { "path": "/content/dam/wknd-shared/en/magazine/…/the-surfers-guide-to-bali-inline.jpg", "mimetype": "image/jpeg" } },
  { "nodeType": "unordered-list", "content": [
      { "nodeType": "list-item", "content": [{ "nodeType": "text", "value": "Beginner:", "format": { "variants": ["bold"] } }, { "nodeType": "text", "value": " Kuta Beach" }] }
  ]},
  { "nodeType": "paragraph", "content": [
      { "nodeType": "text", "value": "Want a coach? Join our " },
      { "nodeType": "reference", "value": "Bali Surf Camp", "data": { "href": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp", "type": "fragment" } },
      { "nodeType": "link", "value": "surf-forecast.com", "data": { "href": "https://www.surf-forecast.com", "target": "_blank" } }
  ]}
]
```

Three things to notice:

1. **Block nodes have `content`** (an array of child nodes): `paragraph`, `header`, the lists. **Leaf nodes have a `value`**: `text`, `link`, and fragment `reference`.
2. **Formatting lives on text nodes** as `format.variants: ["bold" | "italic" | "underline"]`.
3. There are **two kinds of `reference` node**, told apart by their `data`: `data.path` (+`mimetype`) points at a **DAM asset** (an inline image); `data.href` + `type: "fragment"` points at **another fragment**.

The tree maps directly onto React: a function that takes one node and returns an element, calling itself for the children. That is all "recursive renderer" means.

> [!WARNING]
> Adobe documents the node types `paragraph`, `text`, `link`, `reference`, lists and headers, but the exact tree depends on the RTE configuration and AEM version. Write the renderer defensively: unknown node types must never crash a page in production. Authors **will** find new ones.

### 4. `_references`: resolving paths

A `reference` node knows only a path (`/content/dam/…/inline.jpg`). To render an `<img>` you need that image's `_dynamicUrl`, `width`, `height`. AEM solves this with a field called **`_references`** that sits *next to* `items` (or `item`) and returns **every** fragment and asset the result references — including the ones embedded inside rich text:

```graphql
authorList(_locale: "en", limit: 1) {
  items { firstName bio { json } }
  _references {
    __typename                                   # always select it: it tells the members of the union apart
    ... on ImageRef { _path _dynamicUrl width height }
  }
}
```

```json
"_references": [
  { "__typename": "ImageRef", "_path": "/content/dam/wknd-shared/en/contributors/ian-provo.jpg", "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--139d041f-…/ian-provo.jpg?preferwebp=true" }
]
```

It is a union, so you must name the types you care about with inline fragments. **Members you don't ask about still appear** — as empty objects, or holding only `__typename` if you selected it (which is why you always should). Always include `_path` in the fragments you select, because that's the key you match the rich text against.

To use it efficiently, build a lookup **once**, then resolve each node in O(1):

```ts
const byPath = new Map(references.flatMap((ref) => ("_path" in ref ? [[ref._path, ref] as const] : [])));
byPath.get(node.data.path);   // → the ImageRef, or undefined if AEM didn't return it
```

### 5. Rendering rich text in React, safely

- **Don't use `dangerouslySetInnerHTML`.** With `json` you render elements, so React escapes everything. No sanitiser needed, no XSS from an author-supplied `<script>`.
- **Keys:** a list of children needs `key`. The array index is fine here because the tree never reorders.
- **Total functions:** a `switch` on `nodeType` needs a `default` branch that renders the node's `content` if it has one, and nothing otherwise.
- **Absolute URLs:** `_dynamicUrl` is relative (Lab 07). The helper `aemImageUrl(dynamicUrl, { width })` from `@/lib/aem/image` makes it absolute and sets a width.
- **Links to fragments:** the node's `href` is a *DAM path*, not a URL on your site. You map it to a route by looking the fragment up in `_references` and using its `slug`.

## Data shape: `_references`

```json
"_references": [
  { "__typename": "ImageRef", "_path": "/content/dam/…/the-surfers-guide-to-bali-featured.jpg", "_dynamicUrl": "/adobe/dynamicmedia/deliver/…", "width": 2400, "height": 1350 },
  { "__typename": "ImageRef", "_path": "/content/dam/…/the-surfers-guide-to-bali-inline.jpg", "_dynamicUrl": "/adobe/…", "width": 1200, "height": 800 },
  { "__typename": "AuthorModel" },
  { "__typename": "AdventureModel", "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp", "title": "Bali Surf Camp", "slug": "bali-surf-camp" }
]
```

(`AuthorModel` carries nothing but `__typename` because the selection only has inline fragments for `ImageRef` and `AdventureModel`.) The matching TypeScript types — `Article`, `ArticleReference` — are in [types.ts](./types.ts).

## Your tasks

### Task 1 — the article list · [queries.ts](./queries.ts) → `ARTICLE_LIST_QUERY`, `getArticleList()`

```graphql
query ArticleList {
  articleList(_locale: "en", sort: "publishDate DESC") {
    items { _path slug title excerpt }
  }
}
```

`getArticleList()` runs it with `aemQuery<ArticleListData>(ARTICLE_LIST_QUERY)` (from `@/lib/aem/client`) and returns `data.articleList.items`.

**Works when:** it returns 7 articles, the newest (`packing-light-the-wknd-way`) first.

### Task 2 — one article with its references · [queries.ts](./queries.ts) → `ARTICLE_BY_SLUG_QUERY`, `getArticle(slug)`

Build it in four blocks inside `articleList(_locale: "en", filter: { slug: { _expressions: [{ value: $slug }] } })`:

| Block | Selection |
| --- | --- |
| scalars | `_path title excerpt publishDate readingTimeMinutes` |
| content refs | `featuredImage { ... on ImageRef { _dynamicUrl width height } }` |
| rich text | `main { json }` |
| fragment refs | `authorFragment { firstName lastName occupation profilePicture { ... on ImageRef { _dynamicUrl } } }` and `relatedAdventures { _path title slug price }` |

…and **beside `items`** (not inside it):

```graphql
_references {
  __typename
  ... on ImageRef { _path _dynamicUrl width height }
  ... on AdventureModel { _path title slug }
}
```

Variable: `$slug: String!`. `getArticle(slug)` returns `{ article: items[0], references: _references }`, or `null` when `items` is empty.

**Works when:** the author is *Stacey*, the related adventures are `bali-surf-camp` and `surf-camp-costa-rica`, and `references` contains `ImageRef`, `AuthorModel` and `AdventureModel` entries.

### Task 3 — the renderer · [RichText.tsx](./RichText.tsx) → `RichText({ nodes, references })`

Structure (concept 4 + 5):

1. Build `byPath` from `references` once.
2. Write a helper `renderNode(node, byPath, key)` that `switch`es on `node.nodeType` and calls itself for `content` children.
3. `RichText` returns `<>{nodes.map((node, index) => renderNode(node, byPath, index))}</>`.

Exact output per node type (the test compares markup):

| `nodeType` | Output |
| --- | --- |
| `paragraph` | `<p>` + children |
| `header` | the tag from `node.style` (`h1`…`h6`): `<h2>…</h2>` |
| `unordered-list` / `ordered-list` / `list-item` | `<ul>` / `<ol>` / `<li>` + children — no wrapper elements in between |
| `text` | the `value`; wrapped in `<strong>` for `bold`, `<em>` for `italic`, `<u>` for `underline` (one wrapper per variant in `format.variants`) |
| `link` | `<a href={data.href}>{value}</a>`; when `data.target` is set add `target` **and** `rel="noreferrer"` |
| `reference` with `data.path` | look up `byPath.get(data.path)`. If it is an `ImageRef` with a `_dynamicUrl`: `<img src={aemImageUrl(_dynamicUrl, { width: 1200 })} width={width} height={height} alt="" />` — **`src` first**, the test matches on it. Otherwise render nothing. |
| `reference` with `data.href` | look up `byPath.get(data.href)`. If it is an `AdventureModel`: `<a href="/capstone/adventures/<slug>">{node.value}</a>` (build the string from the adventure's `slug`). If it isn't found, render just `node.value` as text. |
| anything else | render its `content` children if it has any, otherwise `null` — never throw |

Tip: TypeScript narrows the node union when you `switch` on `nodeType`, but both `reference` variants share that tag. Tell them apart with `"path" in node.data`.

**Works when:** all four `<RichText>` tests pass, including *"does not crash on unknown node types and keeps their children"*, and the workspace renders every article with headings, bold text, lists, the inline image and a working adventure link.

## Acceptance criteria

- `npm test -- 10` passes (it renders a fixture tree with `react-dom/server` and checks the markup).
- Every article in the workspace renders with headings, bold/italic text, lists, the inline image and a working link to the referenced adventure.
- No `dangerouslySetInnerHTML` anywhere.

## Stretch goals

- Render inline fragment references as a small **card** (title + price) instead of a link — you'd need more fields in the `... on AdventureModel` selection.
- Make the renderer pluggable: accept a `components` map (`{ paragraph: MyParagraph, … }`) like `react-markdown` does.
- Compare with `main { html }`: what would you need to sanitise, and how would you rewrite `/content/dam/…` links?
