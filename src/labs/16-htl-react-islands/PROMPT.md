## Goal

Before headless, AEM rendered pages itself: a **component** is a folder in the repository, its markup is written in **HTL**, its data comes from a **Sling Model**, and React (if any) is a guest that takes over a few `<div>`s. Most AEM codebases you will inherit still work this way. In this lab you build the bridge: the code that finds those `<div>`s in server-rendered HTML, **reads the props AEM put there** and mounts your React components — defensively, because authors, not developers, control the values.

## Lecture: how classic AEM builds a page

### 1. From URL to markup

```
GET /content/wknd/us/en/adventures.html
        │
        ▼  Sling resolves the URL to a resource in the repository (JCR)
/content/wknd/us/en/adventures/jcr:content          sling:resourceType = wknd/components/page
        └── root/container/card-bali                sling:resourceType = wknd/components/adventurecard
                                                    title="Bali Surf Camp"  price=1450  (← what the author typed in the dialog)
        ▼  for each resource, Sling finds the component by resource type…
/apps/wknd/components/adventurecard/
        ├── .content.xml          component definition
        ├── _cq_dialog/           the dialog authors fill in
        ├── adventurecard.html    the HTL script   ← markup
        └── clientlibs/           CSS/JS for this component
        ▼  …and runs the script, which calls a Sling Model for the data
```

Three ideas to hold on to:

- **The repository is a tree of nodes with properties.** A page is `jcr:content` with children; every component instance is a node whose `sling:resourceType` says *which component renders it*. The dialog just writes properties onto that node.
- **Rendering is server-side and per request** (then cached by the Dispatcher/CDN, see below). The browser receives finished HTML.
- **Author and Publish are separate JVMs.** Authors edit on Author; activating (publishing) a page copies it to Publish. The same component renders on both — Author adds editing hooks.

### 2. Sling Models: the Java object behind a component

A **Sling Model** is a Java class that is "adapted" from the component's resource and exposes properties the HTL script reads. It is where logic lives, so the HTL script stays dumb.

```java
@Model(adaptables = Resource.class, resourceType = "wknd/components/pricetag", defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class PriceTag {
    @ValueMapValue private Double amount;          // reads the "amount" property of the node
    @ValueMapValue @Default(values = "USD") private String currency;
    @ValueMapValue private boolean sale;
    @ValueMapValue private String label;
    public Double getAmount() { return amount; }   // → ${model.amount} in HTL
    // …
}
```

### 3. HTL: the template language

HTL (HTML Template Language, formerly *Sightly*) is deliberately small. Everything is an attribute (`data-sly-*`) or an expression (`${…}`), so the file stays valid HTML.

```html
<!-- locationcard.html — a *different* component than the ones in this lab's tasks -->
<div data-sly-use.model="com.wknd.core.models.LocationCard"
     data-sly-test="${model.name}"                  <!-- render nothing when there is no name -->
     class="cmp-location">
  <h3 class="cmp-location__name">${model.name}</h3>              <!-- text context: HTML-escaped automatically -->
  <a href="${model.url}">${'Details' @ i18n}</a>                 <!-- attribute context: URL-checked -->
  <ul data-sly-list.tag="${model.tags}"><li>${tag}</li></ul>     <!-- loop; "item" / "itemList" are implicit names -->
  <sly data-sly-resource="${'child' @ resourceType='wknd/components/image'}"/>   <!-- include another component -->
</div>
```

The parts you need for this lab:

| HTL | What it does |
| --- | --- |
| `${expr}` | outputs a value. **The output is escaped for where it lands** (text, attribute, URI, script …) — this is HTL's best feature |
| `${expr @ context='html'}` | declares the context. `html` keeps markup but strips what could carry XSS; `text`, `attribute`, `uri` (outputs **nothing** if the URI is risky), `scriptString`/`scriptToken`/`styleString`…, **`unsafe`** ("disables XSS protection completely"). Inside `<script>`/`<style>` you **must** declare a context, otherwise HTL outputs nothing |
| `data-sly-use.model="…"` | adapts the resource to a Sling Model and binds it to `model` |
| `data-sly-test="${…}"` | render this element only if truthy. Falsy: `false`, `0`, `""`, `[]`. Truthy: the **string `"false"`** and `[0]` (HTL specification) |
| `data-sly-list` / `data-sly-repeat` | loops |
| `data-sly-resource` | include another resource (usually another component) |
| `data-sly-attribute.data-foo="${…}"` | set an attribute dynamically |
| **boolean attributes** | `data-sale="${true}"` renders `data-sale` (bare); `data-sale="${false}"` renders **nothing**. The *strings* `'true'`/`'false'` get no such treatment (`data-sale="false"`), and an **empty string or empty array also removes the attribute** (HTL specification) |

> [!WARNING]
> That last row matters for this lab: a `false` becomes a **missing attribute**, and a `true` becomes an attribute with an **empty value**. Neither looks like `"true"`/`"false"`. Your parser has to know.

### 4. Four ways to hand data to React

AEM cannot run React for you (no Node on Publish), so HTL emits markup *around* a placeholder, and a JavaScript bundle delivered through a **client library** (`clientlibs`) mounts React after the page loaded. The data goes through the HTML:

| Pattern | HTL | Good for | Watch out |
| --- | --- | --- | --- |
| **A. Individual data attributes** | `<div data-react-component="PriceTag" data-amount="${model.amount}" data-sale="${model.sale}">` | 2–5 flat primitives | **everything is a string**; booleans vanish; `"1200"` becomes a number when you coerce; no nesting |
| **B. One JSON attribute** | `<div data-react-component="Card" data-props="${model.propsJson}">` | nested data, keeps types | HTL escapes the quotes (`&#34;`) — the browser un-escapes them for you; size limited by good taste |
| **C. JSON script tag** | `<div data-react-component="Departure" data-props-id="p1"></div><script type="application/json" id="p1">${model.propsJson @ context='unsafe'}</script>` | big payloads, many components | needs a unique id; `unsafe` context means **your model must escape `<`** (see §6) |
| **D. Fetch it** | `<div data-react-component="List" data-src="${model.jsonUrl}">` → `fetch('….model.json')` | data that changes between cache refreshes, or is huge | extra request after load (Lab 17) |

What the browser gets for A and B, for the **Location** example (not the lab's component):

```html
<div data-react-component="LocationCard" data-name="Kuta Beach" data-lat="-8.72" data-featured></div>
<div data-react-component="LocationCard" data-props="{&#34;name&#34;:&#34;Kuta Beach&#34;,&#34;tags&#34;:[&#34;surf&#34;]}"></div>
```

and in JavaScript, `element.dataset` is `{ reactComponent: "LocationCard", name: "Kuta Beach", lat: "-8.72", featured: "" }` — note the **camelCase** keys and the **string** values.

### 5. The island lifecycle

```
HTML arrives ─► clientlib bundle loads ─► DOMContentLoaded ─► mountIslands(document) ─► createRoot(el).render(<Comp {...props}/>)
```

- Each placeholder is an independent React **root** ("island"). They share nothing unless you build it (a module-level store, events). Do not put 40 islands on a page and expect one React tree.
- No server-side rendering: the first paint shows an empty `<div>`. Reserve its space, or the page jumps.
- **Idempotence.** In the Author's page editor, saving a dialog makes AEM re-render the component and swap its HTML. The new `<div>` has to be mounted, the old root unmounted, and nothing may be mounted twice. That is what `data-react-mounted` is for.
- **Registry, not globals.** Map `data-react-component` names to components in one object. A string from the DOM must never index an arbitrary object (`"constructor"`!).

### 6. Everything in a dialog field is untrusted

HTL escapes by context, so HTL output is safe by default. When you move the data into React **you** inherit that responsibility:

- React escapes **text** — `{props.title}` is safe even if an author types `<script>`.
- React does **not** validate **URLs**: `<a href={props.link}>` happily runs `javascript:alert(1)` when clicked. Validate every author-supplied link (Task 4).
- A JSON script tag must escape `<` as `<`, or a value containing `</script>` closes the tag early. (The mock does; you will see `<` in the page.)
- Props can be missing, wrong type or stale: the HTML was rendered when the Dispatcher cached it, maybe hours ago.

### 7. Caching, in one paragraph

Publish pages go through the **Dispatcher** (an Apache module) and a CDN. A cached `.html` is served without touching the JVM until an *activation* invalidates it. So the props in `data-props` are a **snapshot at render time**; if a price must be live, pass an *id* and fetch the price (pattern D, or GraphQL — Labs 7–11).

> [!NOTE]
> Adobe's HTL documentation says that for *new* projects it recommends Edge Delivery Services; HTL remains the template language of the large installed base of AEM Sites projects, which is what this lab prepares you for.

### Check your understanding

Answer these before you start (answers are in the solution walkthrough):

1. A page contains `<div data-sale>`. What does `dataset.sale` contain? What if the HTL had `data-sale="${false}"`?
2. Why does a one-liner like `const Component = registry[element.dataset.reactComponent]` deserve a second look?
3. An author enters `javascript:alert(1)` in a "Link" dialog field. Where does it become dangerous — in HTL, in React, or both? Which one protects you by default?
4. You need to pass a nested object of 4 KB to a React component. A, B, C or D — and why?
5. Why can't you rely on `data-price="1450"` to always arrive as the number `1450` in your component?

## The page you work with

`GET http://localhost:4503/content/wknd/us/en/adventures.html` — open it in your browser and *View Source*. The body contains six mount points (the `<div>`s with `data-react-component`) and one `<script type="application/json">`:

```html
<div data-react-component="PriceTag" data-amount="1450" data-currency="USD" data-sale data-label="Bali Surf Camp"></div>
<div data-react-component="PriceTag" data-amount="2100" data-currency="EUR" data-label="Cycling Tuscany"></div>
<div data-react-component="PriceTag" data-amount="0" data-currency="USD" data-label="Local meetup"></div>
<div data-react-component="AdventureCard" data-props="{&#34;title&#34;:&#34;Bali Surf Camp&#34;,&#34;activity&#34;:&#34;Surfing&#34;,&#34;price&#34;:1450,&#34;difficulty&#34;:&#34;Beginner&#34;,&#34;detailsUrl&#34;:&#34;/content/wknd/us/en/adventures/bali-surf-camp.html&#34;,&#34;tags&#34;:[&#34;surfing&#34;,&#34;bali&#34;,&#34;beginner-friendly&#34;]}"></div>
<div data-react-component="AdventureCard" data-props="{…&#34;detailsUrl&#34;:&#34;javascript:alert('xss')&#34;…}"></div>
<div data-react-component="Departure" data-props-id="departure-props-a1b2c3"></div>
<script type="application/json" id="departure-props-a1b2c3">{"date":"2026-12-04","label":"Next Bali departure","showWeekday":true}</script>
```

The provided file [`html.ts`](./html.ts) plays the browser: `parseMountPoints(html)` returns an object with `querySelectorAll` and `getElementById`, like `document`. In a real clientlib you would write:

```ts
import { createRoot } from "react-dom/client";
mountIslands(document, registry, (element, node) => {
  const root = createRoot(element as HTMLElement);
  root.render(node);
  return root;
}, (error) => console.error(error));
```

## Your tasks

### Task 1 — read the props · [props.ts](./props.ts) → `coerceAttribute(value)`, `readProps(element, readScript)`

`coerceAttribute` turns one attribute string into a JS value (rules are in the file's comment; the test lists every case). `readProps` picks the right convention: `data-props-id` → `data-props` → individual attributes, ignores the bookkeeping attributes, and throws `PropsError` (naming the component) for bad JSON, non-objects and missing script tags.

**Works when:** the *Task 1* tests pass, and in the workspace each island shows the props you produced — `PriceTag` #1 has `sale: true`, #2 has no `sale` key, #3 has `amount: 0`.

### Task 2 — mount the islands · [islands.ts](./islands.ts) → `mountIslands(host, registry, mount, onError)`

Follow the five steps in the comment. The two traps are on purpose: `Object.hasOwn` for the registry lookup, and *keep going after an error* — one author's broken component must not blank the page.

**Works when:** *Task 2* tests pass, including *"reports unknown components and keeps going"* and *"does not mount the same element twice"*; the workspace shows **6 mounted**.

### Task 3 — the PriceTag component · [PriceTag.tsx](./PriceTag.tsx) → `PriceTag(props)`

Format an amount for a price badge. The details that matter are the ones HTL and authors hand you: `0` is **Free** (not "missing"), a bad amount is "—", a nonsense currency must not throw.

**Works when:** the four `<PriceTag>` tests pass and the three badges in the workspace read **$1,450 · Sale**, **€2,100**, **Free**.

### Task 4 — make author links safe · [links.ts](./links.ts) → `safeHref(value)`

**Works when:** the `safeHref` table passes, and the "Mystery Trip" card in the workspace shows *link blocked* instead of an `<a>`.

## Acceptance criteria

- `npm test -- 16` passes.
- The workspace shows 6 mounted islands, no errors, the Free / Sale badges and one blocked link.
- No `dangerouslySetInnerHTML`, no `eval`, no `new Function`.

## Stretch goals

- Add `unmountIslands(mounted)` and a `MutationObserver` that mounts new placeholders and unmounts removed ones — what the page editor needs.
- Support pattern D: `data-src="/…model.json"` → fetch, then render (what should the placeholder show while loading?).
- Validate props with a schema (zod/valibot) per component and report *which* field is wrong in the `PropsError`.
