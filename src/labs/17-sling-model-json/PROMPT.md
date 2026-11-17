## Goal

Between HTL-with-islands (Lab 16) and full headless (Labs 7–15) sits a very common setup: your front end fetches **JSON that AEM generates from the same Sling Models that feed HTL**. It needs no Content Fragments and no GraphQL; every Core Component already supports it. In this lab you consume that JSON the way a production front end must: with a safe fetcher, an **adapter layer** that keeps your components independent of AEM's export format, and a sanitiser for the one thing the export does *not* clean for you — rich text.

## Lecture: the Sling Model Exporter

### 1. One model, two outputs

```
                       ┌─► HTL script   ─► <h2 class="cmp-title__text">…</h2>          GET /…/title.html
resource ─► Sling Model┤
                       └─► Exporter     ─► { "text": "…", "type": "h2", … }           GET /…/title.model.json
```

The `@Exporter(name = "jackson", extensions = "json")` annotation on a Sling Model publishes its getters as JSON under the **`model` selector**. [Core Components](https://github.com/adobe/aem-core-wcm-components) (Title, Text, Image, Teaser, Container, List …) all do; your custom models can do the same with one annotation. The URL grammar is Sling's:

```
/content/wknd/us/en/featured .model .json
└───── resource path ─────────┘ └selector┘ └extension
```

- **Page**: `/content/wknd/us/en/featured.model.json` → the whole page model (a tree, see below).
- **Component**: `/content/wknd/us/en/featured/jcr:content/root/container/hero.model.json` → just that component (`_jcr_content` is the same as `jcr:content` in URLs).
- **Not** `.infinity.json`, `.tidy.json` or `.1.json`: those are the generic JCR dumps. They return *repository structure* (including `jcr:primaryType`, `cq:template` …), change when someone moves a node, and are blocked on Publish by Dispatcher filters. Try them on the mock: you get a 403.

### 2. What the JSON looks like

Every node has `:type` — the resource type that tells you *which component* this is — and optionally `:path`. Containers hold children in **`:items`** (an object keyed by node name) with the order in **`:itemsOrder`** (JSON objects are unordered by contract; AEM gives you the order separately):

```json
{
  ":type": "wknd/components/page",
  "title": "Featured adventures",
  ":items": {
    "root": {
      ":type": "wknd/components/container",
      "gridClassNames": "aem-Grid aem-Grid--12 aem-Grid--default--12",
      "columnClassNames": { "title": "aem-GridColumn aem-GridColumn--default--12" },
      ":items": { "title": { ":type": "wknd/components/title", "text": "Featured adventures", "type": "h1" } },
      ":itemsOrder": ["title"]
    }
  },
  ":itemsOrder": ["root"]
}
```

Lab 18 renders that tree. This lab is about the **leaves** — the exports of individual Core Components:

| Component | Interesting fields | Gotcha |
| --- | --- | --- |
| **Title** | `text`, `type` (`h1`…) | `type` is the heading level, not the component type |
| **Text** | `text`, `richText` | when `richText` is `true`, `text` is **HTML** |
| **Image** | `src`, **`srcUriTemplate`**, `alt`, `widths`, `lazyEnabled` | `src` is one fixed rendition; the template has a `{.width}` placeholder |
| **Teaser** | `title`, `titleType`, `description` (HTML), `linkURL`, `actions[]`, image | `linkURL` and `actions[].url` are **repository paths** (`/content/wknd/us/en/x.html`) |

### 3. Four things that bite

**(a) The export is not filtered.** HTL's `@ context='html'` passes rich text through AEM's XSS filter. The Jackson export serialises the property as it is stored. Authors paste from Word and from e-mails; sometimes someone malicious has an author account. If you put `text` into `dangerouslySetInnerHTML` unfiltered you have an XSS hole that HTL never had. *You* must sanitise (Task 3).

**(b) Links are paths, not URLs.** `linkURL: "/content/wknd/us/en/adventures.html"` works on the AEM-rendered site because Sling Mapping / the Dispatcher rewrite it. In your Next.js app the URL is `/adventures`. Somebody has to translate (Task 2), and it must respect the segment boundary: `/content/wknd/us/english/…` is not under `/content/wknd/us/en`. DAM links need the Publish host in front.

**(c) Images are templates.** Core Components generate renditions on request: `…/image.coreimg.800.jpeg/1730000000000/<uuid>/hero.jpg` gives you 800px. The model gives you `srcUriTemplate` with `{.width}` so *you* decide which widths to ask for — that is how you get an `srcset` (Task 4). It is the classic equivalent of `_dynamicUrl` + `_assetTransform` from Lab 13.

**(d) The format is not your API.** The shape depends on the Core Components **version**. A teaser can gain a field or change a name when the project upgrades. If 40 React components read `model.image.srcUriTemplate` directly, an upgrade is a 40-file change. Put an **adapter layer** between the export and your components (`adaptTeaser`): one function that maps the AEM shape to *your* props (anti-corruption layer). Everything else only knows `TeaserViewModel`.

### 4. Fetching safely

- **Path in, URL out.** If a path comes from a URL or query string and you glue it onto the AEM host, an attacker can point your server at `//evil.example/x` or `/content/../system/console` (server-side request forgery, path traversal). Validate: starts with `/content/`, no `..`, not protocol-relative (Task 1).
- **Status 200 is not "JSON".** Author in front of SSO, a Dispatcher error page or a maintenance page can answer with HTML. `response.json()` then throws a cryptic `Unexpected token '<'`. Check the content type and raise a typed error.
- **Cache policy.** Publish answers `.model.json` through the Dispatcher like any other file: cacheable, invalidated on activation. Dispatcher also filters *selectors*; if `.model.json` returns 404/403 in a real project, the dispatcher `filter` rules or the `statfileslevel` are the first thing to check. On Author, never cache: it is the editor's live view.
- **CORS.** A browser on another origin needs a CORS policy on AEM (OSGi `CORSPolicyImpl`) for GETs to `/content/…model.json`. Server-side fetches (Server Components) do not.

### 5. Compared with GraphQL

| | Sling Model JSON (`.model.json`) | Content Fragment GraphQL (Labs 7–15) |
| --- | --- | --- |
| Content lives in | pages and components (JCR nodes) | Content Fragments (structured, model-driven) |
| Contract | whatever the Java model exports; changes with component versions | a schema generated from the Fragment Model; introspectable |
| You choose the fields | no (you get the whole export) | yes |
| Layout and authoring | yes — pages, components, grid, editor | no layout |
| Reuse across channels | tied to a page | made for it |
| Typical use | websites authored in the Page Editor | apps, headless, shared content |

They combine: **Lab 19** takes layout from the page model and content from GraphQL.

### Check your understanding

1. Which URL returns the Teaser component of a page, and which one returns the whole page? What two things in the second URL tell Sling what to do?
2. Why does `.infinity.json` not belong in a front end, even if it works on your local SDK?
3. An author edits a Text component. In HTL the text appears filtered; in the JSON it is raw. Why is that, and where is the right place to fix it?
4. What is the difference between `src` and `srcUriTemplate` of an Image export, and which one would you use for an `<img srcset>`?
5. Your site root is `/content/wknd/us/en`. Does `/content/wknd/us/english/news.html` belong to it?

## Try it

All of these work in your browser on the mock (Publish, anonymous):

```text
http://localhost:4503/content/wknd/us/en/featured.model.json
http://localhost:4503/content/wknd/us/en/jcr:content/root/container/hero.model.json
http://localhost:4503/content/wknd/us/en/jcr:content/root/container/promo.model.json     # the "pasted from an e-mail" text
http://localhost:4503/content/wknd/us/en.infinity.json                                   # 403
```

A teaser export (shortened):

```json
{
  ":type": "wknd/components/teaser",
  "title": "Live your adventure", "titleType": "h1",
  "description": "<p>Surf, ski, climb and cycle. <b>New trips every month.</b></p>",
  "linkURL": "/content/wknd/us/en/adventures.html",
  "actionsEnabled": true,
  "actions": [
    { "id": "hero-…-action-0", "title": "Browse adventures", "url": "/content/wknd/us/en/adventures.html" },
    { "id": "hero-…-action-2", "title": "Surf forecast", "url": "https://www.surf-forecast.com" }
  ],
  "image": {
    "src": "/content/wknd/us/en/jcr:content/root/container/hero/image.coreimg.1200.jpeg/1730000000000/<uuid>/bali-surf-camp-hero.jpg",
    "srcUriTemplate": "/content/wknd/us/en/jcr:content/root/container/hero/image.coreimg{.width}.jpeg/1730000000000/<uuid>/bali-surf-camp-hero.jpg",
    "alt": "Surfer on a wave in Bali", "widths": [320, 480, 800, 1200, 1600]
  }
}
```


> [!NOTE]
> Verify against your version: the field names in this export are modelled on Core Components but not copied from a live instance. Adobe's component READMEs document the dialog properties (`./linkURL`, `./actions`, `./titleType`, `./textIsRich`, `allowedRenditionWidths`) and name the Sling Models, not the JSON; generate the real export from your own instance (`.model.json`) before you write adapters. Adobe also documents that non-Dynamic-Media images are served by `AdaptiveImageServlet` under `<component>.coreimg.<quality>.<width>.<extension>`. The mock simplifies Core Components: the real Teaser nests its image differently depending on the version — which is exactly why you need an adapter. The TypeScript shapes are in `src/lib/aem/page-model.ts`.

## Your tasks

### Task 1 — a safe fetcher · [model.ts](./model.ts) → `modelUrl(path)`, `fetchModel(path, options)`

**Works when:** the `modelUrl` table passes (including the six refused inputs) and `fetchModel` loads the featured page, a component, throws `AemModelError` with the status for a missing page and for an unauthenticated Author request.

### Task 2 — map paths to routes · [links.ts](./links.ts) → `toRoute(linkURL, siteRoot)`

**Works when:** every row of the `toRoute` table passes (look at the *english* row and the `?query#fragment` rows twice).

### Task 3 — sanitise rich text · [sanitize.ts](./sanitize.ts) → `sanitizeRichText(html)`

An allow-list sanitiser in ~50 lines: tokenise, drop what is not allowed, keep the output balanced. The `javascript:` rows of the test are the interesting ones: the browser decodes **HTML entities in attribute values before it looks at the URL scheme**.

**Works when:** all *Task 3* tests pass, and in the workspace the "pasted from an e-mail" block renders as *Book now! Click here* and *Offer ends **soon**.* — no script, no `onclick`, a link without `href`.

### Task 4 — the adapter layer · [teaser.ts](./teaser.ts) → `buildSrcSet(template, widths)`, `adaptTeaser(model)`

Put Tasks 2 and 3 to use: `adaptTeaser` maps the export to `TeaserViewModel` (see [types.ts](./types.ts)).

**Works when:** the *Task 4* tests pass and the workspace shows the hero teaser with its image (check the `srcset` in the dev tools), a working "Browse adventures" link to `/adventures` and an external link that opens in a new tab.

## Acceptance criteria

- `npm test -- 17` passes.
- The workspace shows the teaser, the sanitised promo text next to the raw one, and the banner image with a five-width `srcset`.
- `dangerouslySetInnerHTML` appears in the provided UI only, and only on strings that went through `sanitizeRichText`.

## Stretch goals

- Add an `adaptImage(model)` and a `Text` adapter, then render all of `featured.model.json` through the adapters (Lab 18 gives you the renderer).
- Support `?cache-bust` safely: how would you make `fetchModel` pass `next: { tags: [path] }` so a publish webhook (Lab 15) can revalidate it?
- Replace your sanitiser with DOMPurify or `sanitize-html` and run the same tests. What does the library do that yours does not?
