## Answers to the questions

1. Because the author's order is data. Object key order in JSON is an implementation detail of the serializer; dragging a component changes `:itemsOrder` and nothing else. Reading `Object.keys(:items)` works until the first reorder.
2. Visitors: nothing visible, or the component's normal empty rendering (an empty heading is usually bad HTML, so many projects render nothing when `isEmpty`). Authors: a placeholder. An empty component has no pixels to click — without a placeholder the author could never select it to open the dialog and fill it in.
3. `:path`. It is the repository location, unique within a page and the exact key the editor uses to say "this component changed". `id` is generated for DOM use (anchors, analytics) and is not what the editor refers to.
4. `mapping.get("/apps/wknd/components/title")` finds nothing: the component renders as unmapped (invisible on Publish!). Normalising `/apps/` and `/libs/` once, inside the registry, keeps the rest of the code ignorant of the two spellings.
5. Unchanged subtrees are **the same data**, so reusing them is correct and cheap; React can bail out on `===`. Mutating the old model breaks that: React compares the new and old object, finds one object, and skips the render. It also makes undo, concurrent renders and tests harder.

## Walkthrough

### Task 1 — mapping

A `Map` inside the closure, `normalize` applied on both `set` and `get`, and `MapTo` returning the component it received. Returning the component matters because Adobe's pattern is `export default MapTo(type)(Component, config)`.

### Task 2 — childrenOf

```ts
const order = model[":itemsOrder"] ?? Object.keys(items);
return order.flatMap((key) => (Object.hasOwn(items, key) ? [{ key, model: items[key] }] : []));
```

`flatMap` does the skipping in one pass; `Object.hasOwn` keeps names from content (`constructor`, `__proto__`) from walking the prototype chain — the same trap as in Lab 16's registry.

### Task 3 — the renderer

Three decisions carry the whole function:

```tsx
const props = { cqPath, isInEditor, ...everything not starting with ":" };   // the component's data, nothing structural
const grid  = isContainer ? <div className={gridClassNames}>{children in order, each in its column}</div> : null;
const out   = mapped ? <Component {...props}>{grid}</Component> : isContainer ? grid : (isInEditor ? <Unmapped/> : null);
return isInEditor ? <div data-cq-data-path={cqPath}>{out}</div> : out;
```

- **Structural keys never reach components.** If `:items` leaked into props, every component would depend on the page model's internals.
- **Containers are not special types**, just nodes with `:items`: that is how the unmapped `container` still renders (a project without a mapped container is the normal case for simple sites).
- **Everything editor-specific lives on one line** (`isInEditor ? wrapper : out`) and in the placeholder branch. If you find `isInEditor` anywhere else you are probably changing what visitors see.
- Why `key` is the **node name**, not the index: reordering moves keys; index keys would remount components when the author drags.

### Task 4 — findByPath / applyUpdate

```ts
if (root[":path"] === cqPath) return replacement;
for each child: updated = applyUpdate(child, …); if (updated !== child) return { ...root, ":items": { ...items, [key]: updated } };
return root;
```

"Changed" is detected by **identity** (`updated !== child`), so an update to a missing path returns the original root without allocating anything. Only the ancestors on the way down are copied — here: page → root → container. The `cards` subtree is untouched and compares `===` to the old one.

## Real-world notes

- **What Adobe's packages add** to this lab: `ModelManager.initialize({ path })` (fetch + cache + route handling), `ModelProvider`/`withModel` (wiring a component to its model so it updates itself), `Container`/`ResponsiveGrid` (what Task 3's grid is), `Page`/`RoutedModelProvider` (child pages and client-side routing via `:children`), and `AuthoringUtils` (`isInEditor`). The registry and the placeholders are exactly this lab's.
- **Components without a Sling Model.** The model JSON can contain only what the Sling Model exports. Adding a field means a Java change and a deployment — one of the practical reasons teams moved dynamic data to Content Fragments + GraphQL, and use the page model only for structure. That is Lab 19.
- **Resource type is a public contract.** Renaming a component folder in `/apps` changes `:type` and silently unmaps every instance in the content.
- **Local development.** Run the SPA on `localhost:3000` and proxy `/content`, `/etc.clientlibs` and `/libs` to Author (Next.js `rewrites`), exactly because the editor expects the SPA and the content on one origin.
