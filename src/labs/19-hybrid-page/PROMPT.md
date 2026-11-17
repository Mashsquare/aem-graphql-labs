## Goal

Real AEM projects are rarely pure. You inherit a site where authors build **pages** in the Page Editor (layout, components, dialogs), but the **content** of some components — adventures, articles, products — lives in **Content Fragments**, because it is reused and has a model. This capstone builds that hybrid: the page model decides *what is on the page and how it is laid out*; GraphQL supplies *what the cards say*. You will also meet the questions every hybrid raises: who owns which data, how many requests are enough, and what happens when the two disagree.

## Lecture: the hybrid pattern

### 1. Two kinds of content, two sources

| | Page content (Labs 16–18) | Content Fragments (Labs 7–15) |
| --- | --- | --- |
| What it is | a component instance on one page | a structured, reusable item |
| Author edits it in | the Page Editor (component dialog) | the Content Fragment Editor |
| Changes affect | that page | every page/app that references it |
| Delivered by | HTL / `.model.json` | GraphQL (or the Fragment component's JSON) |
| Example | "show a card with the compact layout" | "Bali Surf Camp: price, difficulty, photo, text" |

A hybrid component stores **only a reference and presentation options** in the page:

```json
{ ":type": "wknd/components/adventurecard", "fragmentPath": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp", "showPrice": true, "layout": "full" }
```

The Content Fragment Core Component and Adobe's SPA Editor sample components work this way: the dialog has a *path field* (fragment picker) and a few checkboxes.

### 2. Rendering strategy: resolve before you render

Naively each card fetches its own fragment: a page with 12 cards makes 12 requests (**N+1**), sequentially hidden inside the render tree. The cure is the same as for any list: *look at the whole tree first, collect what is needed, fetch it once, render*:

```
page model ──► collectFragmentPaths(model) ──► [pathA, pathB, pathC] ──► ONE GraphQL query (filter _path OR …) ──► Map<path, Adventure|null> ──► render
```

Note what makes this work: the **page model is static data you can walk** before React runs. (In a client-only SPA you would do the same in a loader / route function, or batch with a DataLoader.)

### 3. One query for many paths

The filter grammar from Lab 8 applies to `_path` too:

```graphql
query AdventuresByPath($filter: AdventureModelFilter!) {
  adventureList(_locale: "en", filter: $filter) { items { _path title slug price … } }
}
# variables
{ "filter": { "_path": { "_logOp": "OR", "_expressions": [ { "value": "/content/dam/…/a" }, { "value": "/content/dam/…/b" } ] } } }
```

- Build the filter **as a variable**, not by string-concatenating into the query: the number of expressions varies.
- **Edge case with teeth:** if you build `_expressions: []` the filter filters nothing — the response is *every* adventure. Never send the request when there is nothing to ask for.
- The result is a list, not a map, and **missing items do not raise errors**. Index the answer by `_path` and ask "did I get what I asked for?" for every requested path.

### 4. Reference integrity: the fragment may not be there

On **Publish**, a reference can dangle in four ways: the fragment is a draft (never published), it was unpublished, the author mistyped the path, or it was deleted. GraphQL returns *no item* — not an error. Your page must still render. Decide per case, per tier:

| Situation | Visitor (Publish) | Author (editor) |
| --- | --- | --- |
| no `fragmentPath` yet | nothing | placeholder: "Adventure card" (Lab 18) |
| `fragmentPath` set, fragment not available | **nothing** (don't render a broken card) | a visible warning: "Fragment not available on Publish: /content/…" |
| available | the card | the card |

That asymmetry is your reason for `mergeCardProps` returning `null` instead of an empty card.

### 5. Who wins when the page and the fragment disagree?

`showPrice: true` is **presentation**, the author's choice for this page. `price: 1890` is **content**, owned by the fragment. The merge function is where that rule lives:

- content always comes from the fragment; the page never stores a copy (**single source of truth**);
- the page controls whether to *show* it, never *what* it is;
- dialog values are untrusted and optional: a checkbox is `true` or *absent* (Lab 16's boolean lesson), an enum may hold anything.

Remember the `adventures.html` page of Lab 16, rendered by HTL: its Sling Model *copied* the price (`$1,450`) into the markup when the page was rendered, and the Dispatcher cached it. The fragment now says **$1,890**. That is what a snapshot costs. The hybrid page above cannot go stale this way, because the price is read from the fragment at render time (with whatever caching *you* chose).

### 6. Caching and invalidation

Two cache domains, two invalidation signals:

- the **page model** changes when someone activates the *page* (Dispatcher flush / webhook for pages);
- the **fragment content** changes when someone publishes the *fragment* (AEM Eventing webhook — Lab 15).

In Next.js you would cache them separately, with tags such as `page:/content/wknd/us/en/featured` and `fragment:<path>`, and revalidate the right one from the matching webhook. That gives you pages that update without a redeploy and without re-fetching everything (see stretch goals).

### 7. Choosing: a decision table you will use on the job

| Situation | Reach for |
| --- | --- |
| Marketing site, authors need WYSIWYG, you inherit HTL/Core Components | HTL + a few React islands (Lab 16) |
| Same, but React should own the page and authors keep the Page Editor | SPA Editor (Lab 18), maybe with fragments (this lab) |
| Content reused by many channels (web, app, kiosk), no page layout in AEM | Headless GraphQL (Labs 7–15) |
| New project, Edge Delivery / Adobe's newer stack | evaluate Universal Editor + Edge Delivery before anything above |
| Big existing HTL site, one new interactive widget | **islands**, not a rewrite |

### Check your understanding

1. The page model contains `"showPrice": "false"` (a string) because a custom Sling Model exported it badly. What does your card show, and is that the safe default?
2. Why can't the card component simply `fetch` its fragment? Name two problems.
3. A page has three cards that all point at the same fragment. How many fragment fetches should happen, and which step guarantees that?
4. `getAdventuresByPath([])` — what would a naive implementation send, and what comes back?
5. An editor unpublishes a fragment while the page that references it stays published. What do visitors see? What do authors see? Where in your code is this decided?

## The page you work with

`GET http://localhost:4503/content/wknd/us/en/featured.model.json` contains five cards in a `cards` container, and one component nobody mapped:

| Node | `fragmentPath` | What should happen |
| --- | --- | --- |
| `card-one` | bali-surf-camp (`showPrice: true`, `layout: "full"`) | full card with the price |
| `card-two` | ski-touring-mont-blanc (`showPrice: false`, `layout: "compact"`) | compact card, no price |
| `card-draft` | iceland-northern-lights-trek — a **draft** | nothing on Publish; warning in the editor |
| `card-empty` | *(none)* | nothing on Publish; placeholder in the editor |
| `survey` | — | unmapped: nothing on Publish; box in the editor |

The renderer (`ModelComponent`, `createMapping`) comes from `src/lib/aem/spa.tsx` — the reference solution of Lab 18, so you can do this lab without finishing Lab 18. The provided [`ui.tsx`](./ui.tsx) maps the components and calls your functions.

## Your tasks

### Task 1 — what does this page need? · [fragments.ts](./fragments.ts) → `collectFragmentPaths(model)`

**Works when:** both *Task 1* tests pass.

### Task 2 — one query for all of it · [fragments.ts](./fragments.ts) → `ADVENTURES_BY_PATH_QUERY`, `getAdventuresByPath(paths, tier)`

Test the query in GraphiQL (`http://localhost:4503/aem/graphiql.html`) before you wire it.

**Works when:** the *Task 2* tests pass — one request for any number of paths, none for zero, and an entry (possibly `null`) for every path you asked about, including the draft.

### Task 3 — content from the fragment, presentation from the dialog · [card.ts](./card.ts) → `mergeCardProps(authored, fragment)`

**Works when:** the five *Task 3* tests pass and the workspace shows the full card with **$1,890** and the compact card without a price.

### Task 4 — the loader · [page.ts](./page.ts) → `loadHybridPage(pagePath, tier)`

**Works when:** the *Task 4* test confirms **exactly one** `.model.json` request and **one** GraphQL request, and the workspace shows `3 fragment paths in the page` and `2 resolved on Publish`. Switch to *Page editor*: the draft card shows the warning, the empty card the placeholder, the survey the red box.

## Acceptance criteria

- `npm test -- 19` passes.
- The page makes two requests to AEM, whatever the number of cards.
- On Publish nothing visible refers to drafts, empty cards or unmapped components.

## Stretch goals

- Cache with tags: wrap `loadHybridPage` in a `"use cache"` function with `cacheTag(`page:${path}`)` plus one `cacheTag(`fragment:${path}`)` per fragment; extend the webhook route of Lab 15 to revalidate the fragment tags.
- Run the same page against **Author** (`tier: "author"`, with the Basic credentials from Lab 14): the draft card should now render. What does that tell you about previewing unpublished work?
- Add a `wknd/components/survey` component that *is* mapped and appears in the editor with its own `emptyLabel`.
- Replace the `Map<string, Adventure | null>` with a type that makes "missing" and "not asked for" different states.
