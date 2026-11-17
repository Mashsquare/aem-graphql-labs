## Answers to the questions

1. (HTL specification: `true` keeps a boolean attribute, `false` removes it; the string `'false'` would render `data-sale="false"`.) `dataset.sale` is `""` for a bare `<div data-sale>` — the attribute exists, with an empty value. For `data-sale="${false}"` HTL emits **no attribute**, so `dataset.sale` is `undefined`. That is why `coerceAttribute("")` is `true`, and why a missing key must mean "use the default" (`sale = false`).
2. The name comes from the DOM, i.e. from content. `registry["constructor"]` is `Object`'s constructor, a function — React would try to render it. Use `Object.hasOwn(registry, name)` (or a `Map`).
3. Both layers see the string, but only **HTL** neutralises it by default: in an `href` attribute HTL's URI context drops unsafe values. React escapes *text* and attribute *quoting*, not URL schemes. Once you take data out of HTML and into props, you must check URLs yourself.
4. **C** (JSON script tag): 4 KB in an attribute is awkward to read in "View Source" and bloats every mount point; A cannot nest; D adds a round trip. B works, too, up to a point.
5. Attributes are strings. `"1450"` only becomes `1450` because *your* coercion says so — and the same coercion would turn a SKU `"1200"` into a number. A required `string` should travel in JSON (B/C), where types survive.

## Walkthrough

### Task 1 — props

```ts
if (propsId !== undefined) return parseObject(readScript(propsId) …);
if (props !== undefined)   return parseObject(props …);
return Object.entries(dataset).filter(not reserved).map(coerceAttribute);
```

- **Precedence** goes from most to least explicit. A component that has both `data-props` and loose attributes is a bug somewhere; being deterministic matters more than being clever.
- **Only coerce attribute strings.** JSON already carries types; coercing `"007"` inside JSON would corrupt it.
- **Numbers by regex, not `Number(x)`**: `Number("")` is `0`, `Number("0x10")` is `16`, `Number("1e3")` is `1000`, `Number(" ")` is `0`. Authors and IDs make these real.
- **A `PropsError` that names the component** is the difference between "something is wrong on the page" and "the AdventureCard at /content/… has bad JSON".

### Task 2 — mounting

- `mount` is a **parameter** (`createRoot(...).render`) so the logic is testable without a browser, and so React 18/19 differences (`hydrateRoot` for server-rendered islands) stay at the edge.
- `data-react-mounted` is the idempotence marker. In the page editor AEM swaps component HTML after a dialog save; the new element has no marker and gets mounted, the old root must be `unmount()`ed (otherwise it leaks and keeps listeners alive).
- Errors go to a callback, never `throw` out of the loop. In production this callback reports to your monitoring (Sentry, Adobe Launch…).

### Task 3 — PriceTag

`if (!amount)` is the classic bug: `0` is a legitimate price and the author's "free" badge disappears. `Intl.NumberFormat` throws `RangeError` for currency codes it does not know — and a dialog "currency" field is free text unless the dialog restricts it.

### Task 4 — safeHref

Allow-list the schemes you *want* (`http`, `https`, `mailto`, `tel`) instead of block-listing the ones you remember. Remove whitespace and control characters **before** checking: browsers do the same when they parse a URL, so `"java\tscript:"` is a working `javascript:` link.

## Real-world notes

- **Where this runs.** `mountIslands(document, …)` lives in a webpack/Vite bundle in the `ui.frontend` module of an AEM project archetype; `aem-clientlib-generator` copies it into `/apps/<project>/clientlibs/clientlib-react`, and the page's HTL includes it with `data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html"`.
- **Authors change props without a deploy.** That is the main advantage of this model and the reason the defensive code exists. In headless (Labs 7–15) the same values arrive as GraphQL fields with a schema — you trade this runtime defensiveness for a contract.
- **Server-side rendering** for islands needs a Node renderer in front of AEM (Adobe's *Remote Content Renderer* for the SPA Editor, or your own edge). Plain HTL + clientlibs does not have it.
- **Core Components** that you do not need to rewrite: don't re-implement a Title or Image in React; use the Core Component's HTL and keep React for what is genuinely interactive.
- **Experience Fragments, Content Fragments and HTL**: a Content Fragment can also be rendered by HTL (via the *Content Fragment* Core Component). Mixing that with Lab 19's React rendering is a common transition path.
