## Answers to the questions

1. `"false"` is a non-empty string — truthy in JavaScript — so a lazy `if (authored.showPrice)` would **show** the price. `=== true` hides it, which is the safe direction: when the data is odd, show less. The root cause is the Sling Model exporting a string; fix it there, but keep `=== true` anyway (dialogs, imports and old content do produce odd values).
2. N+1 requests (twelve cards → twelve requests, usually sequential because each card mounts when its parent renders), and no place to deal with *the whole page's* data: deduplication, a single error policy, batching, caching. Also every card would need the AEM host and credentials/CORS handling.
3. One. `collectFragmentPaths` returns each path once (a `Set`), so the query contains one expression per distinct path; the `Map` then serves all three cards.
4. `_expressions: []` makes the filter vacuous, so AEM returns **every adventure**; you would then wrongly mark them all "requested" or render hundreds of items. The guard (`if (paths.length === 0) return`) is also a free optimisation: a page with no cards makes no GraphQL request.
5. Visitors: nothing (the loader marks the path `null`, `mergeCardProps` returns `null`, the component returns `null`). Authors: the "Fragment not available on Publish" warning, rendered only when `isInEditor`. The decision is in the card component of `ui.tsx` — the one place that knows both the data state and the mode. `mergeCardProps` stays a pure function.

## Walkthrough

### Task 1 — collectFragmentPaths

A recursive walk that follows `childrenOf` (author order), checks `:type` and `typeof fragmentPath === "string"` and adds to a `Set`. A `Set` gives you "once each, first occurrence first" for free. Typing `unknown` values from JSON with `typeof` is the same defence as in Lab 16: the page model is content, not code.

### Task 2 — one query

```ts
const result = new Map(paths.map((path) => [path, null]));      // every asked-for path starts as "missing"
if (!paths.length) return result;
const data = await aemQuery(QUERY, { filter: { _path: { _logOp: "OR", _expressions: paths.map((value) => ({ value })) } } }, { tier });
for (const item of data.adventureList.items) result.set(item._path, item);
```

Pre-filling the map with `null` is the design: the *absence of an answer* becomes an explicit value the UI can reason about. Also note `result.has(item._path)` in the solution — only fill paths we asked for, whatever else the endpoint returns.

> [!NOTE]
> `_path` here is a repository path of the language root (`/content/dam/wknd-shared/en/…`). With `_locale: "en"` you only ever match English copies; for multilingual sites derive the fragment path per locale, or query by `_id`/slug instead.

### Task 3 — mergeCardProps

A pure function from `(authored, fragment)` to a view model — no fetching, no React. That is what lets the test pin down each rule (checkbox semantics, enum fallback, image width by layout) in a line each, and it keeps the business rule (“who wins”) out of the JSX.

### Task 4 — loader

```ts
const model = await fetchPageModel(pagePath, tier);          // request 1
const adventures = await getAdventuresByPath(collectFragmentPaths(model), tier);   // request 2 — depends on request 1
```

Two requests is the minimum for this design, because the second depends on the first. If latency matters, AEM can compute the join for you instead: a persisted GraphQL query keyed by the page, or a Sling Model that includes the fragment data in the export (at the price of coupling the page and the content).

## Real-world notes

- **Where to put this code in Next.js.** `loadHybridPage` belongs in a Server Component or route-level loader, cached with tags (see the stretch goal). The model renderer and the card are plain components — no hooks needed.
- **Fragment references in dialogs** are paths. They break when someone *moves* the fragment (the path field does not follow a move unless AEM's reference-update runs). Adobe's reference tooling (the *References* panel) helps authors; your code should still survive a dead path.
- **Core Components alternative.** The Content Fragment Component (`core/wcm/components/contentfragment`) exports the elements of a fragment in the page's `.model.json` itself. It removes the second request but couples the page model to the fragment's fields; try both and compare the JSON.
- **Preview.** Authors want to see drafts. That is Lab 14's pattern: when Draft Mode is on, call `loadHybridPage(path, "author")` on the server with the Author credentials, and never ship those credentials to the browser.
- **Where this leaves you.** Lab 16 (islands), Lab 17 (model JSON), Lab 18 (SPA Editor) and this lab cover the integration styles you will meet in existing AEM codebases, and Labs 7–15 the headless style new projects favour. The skills transfer: sanitise what you get, validate what authors type, index lookups by path, and put an adapter between AEM's shapes and your components.
