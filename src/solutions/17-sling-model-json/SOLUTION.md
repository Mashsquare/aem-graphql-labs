## Answers to the questions

1. The Teaser: `/content/wknd/us/en/jcr:content/root/container/hero.model.json`; the page: `/content/wknd/us/en/featured.model.json`. The **selector** (`model`) picks the Sling Model Exporter and the **extension** (`json`) picks the format; the path before them picks the resource.
2. It dumps the repository node, not a model: property names like `jcr:primaryType` and `sling:resourceType`, internal paths, everything an author ever typed into any field. Its shape changes when content is moved, and it exposes data you did not mean to publish. Publish blocks it for good reason; use `.model.json` (or GraphQL).
3. HTL applies AEM's XSS filter by output context (`@ context='html'`). The exporter simply serialises the stored property. The right place to fix it is the *consumer that puts it into HTML* — your front end. (Preventing it at the source is also possible, with an RTE configuration that restricts what can be entered, but you cannot rely on it: content is also imported, pasted and edited via APIs.)
4. `src` is one concrete rendition (one width); `srcUriTemplate` has `{.width}` so you can request any width. `srcset` needs several widths, so you use the template.
5. No. `"english"` merely starts with `"en"`. Compare on the segment boundary: `path === root || path.startsWith(root + "/")`.

## Walkthrough

### Task 1 — fetch

```ts
modelUrl: refuse non-/content/ and ".." → strip trailing slash, ".html", an existing ".model.json" → append ".model.json"
fetchModel: fetch → !ok → AemModelError(status) → content-type not json → AemModelError → response.json()
```

- The two refusals are **input validation at the boundary**. The same mistake in an API route (`fetchModel(searchParams.get("path"))`) is a classic SSRF.
- The content-type check costs one line and saves an hour of staring at `Unexpected token '<'`.
- Return type `Promise<T>` is a *claim*, not a guarantee. For production, validate with a schema at this boundary (zod/valibot) or treat the model as `unknown` and let the adapters narrow it.

### Task 2 — toRoute

```ts
safeHref → split path / ?query#fragment → DAM → absolute Publish URL
                                       → outside the site root (segment boundary) → unchanged
                                       → strip root and ".html"; "" becomes "/"
```

`safeHref` runs first so `javascript:` never gets as far as path logic. Keeping `?query#fragment` is a one-regex detail that silently breaks "Read the magazine → #latest" links when forgotten.

In a real project this function mirrors your **Sling Mapping** (`/etc/map`) or Dispatcher rewrite rules. If several sites live in one AEM, make `siteRoot` a parameter per site (as here), not a constant.

### Task 3 — sanitiser

The shape of the solution is a small tokenizer: `matchAll(TOKEN)` yields tags and comments, everything between is text. Per token: comment → drop; inside a `script`-like element → skip until its close tag; tag not on the list → drop the tag, keep its text; closing tag → close open elements (never leave the output unbalanced); allowed tag → emit it with **only** the attributes you build yourself.

Why each rule exists:

- **Attributes are never copied**, they are *constructed*. There is no blocklist of `onclick`, `onerror`, `onmouseover`, `style`, `srcdoc` … to forget an item from.
- **`<a href>` is decoded before it is checked.** `javascript&colon;` and `&#106;avascript:` are the same URL to a browser. Anything with a named entity we did not decode ourselves is refused.
- **Text is escaped** (`<` and `>`), so a broken tag cannot become a real one: `<scr<script>ipt>` leaves `&lt;scr…ipt&gt;`, not a script.
- **`target="_blank"` always comes with `rel="noopener noreferrer"`**.

> [!WARNING]
> Don't ship this. Sanitising HTML correctly is a specialised problem (mutation XSS, parser differentials, namespaces). Use DOMPurify (browser/jsdom) or `sanitize-html` (Node), pinned and updated. The point of the task is to understand *what they do* and why `dangerouslySetInnerHTML` needs it.

### Task 4 — adapter

```ts
adaptTeaser(model) = { heading, headingLevel ?? "h2", bodyHtml: sanitize(description), href: toRoute(linkURL),
                       image: model.image.src ? {…srcSet} : null, actions: actionsEnabled ? actions.flatMap(usable) : [] }
```

- One function owns every assumption about the export format. A Core Components upgrade changes this file only.
- The adapter is also where defaults live (`h2`, widths) and where *unsafe or empty data becomes absent data*: an action with an unsafe URL is dropped rather than rendered with `href="#"`.
- The view model is plain data: you can unit-test components with literal objects and never mock AEM.

## Real-world notes

- **Selectors are an API.** `.model.json` is the Core Components convention, but Dispatcher `filter` rules decide what is reachable on Publish. Put `/0100 { /type "allow" /extension "json" /selectors "model" /path "/content/*" }`-style rules under version control with the project and test them (the exact syntax depends on your Dispatcher SDK version).
- **Experience Fragments** (reusable page sections such as a header or footer) can be delivered as plain HTML (`…/master.content.html`) and are a common way to share them between an AEM-rendered site and a Next.js app.
- **Core Components versions** are namespaced (`core/wcm/components/teaser/v2`, `v3` …). Look at `:type` to know which one you have. Do not assume it is the same on every site in your instance.
- **The `.model.json` of a *page*** is the page model that the SPA Editor builds on. That is Lab 18.
