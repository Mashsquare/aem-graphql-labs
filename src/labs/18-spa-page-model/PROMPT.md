## Goal

In the **SPA Editor** model, AEM keeps what it is good at — pages, templates, the editing UI, the layout grid — and hands *rendering* to your React app. AEM sends a **page model** (JSON); your app maps each node to a React component; authors still click on the rendered components and edit them in the Page Editor. This lab builds the heart of that machinery from scratch: a **component mapping**, a **recursive model renderer** that knows about the editor, and the **immutable update** an editor session needs. (Adobe ships these as `@adobe/aem-react-editable-components` and `@adobe/aem-spa-page-model-manager`; after this lab their API will look familiar.)

## Lecture: the SPA Editor model

### 1. Where it sits

```
 Classic HTL                  SPA Editor                              Headless (Labs 7–15)
 ────────────                 ──────────                              ────────────────────
 AEM renders HTML             AEM serves the page MODEL (JSON)        AEM serves Content Fragments (GraphQL)
 React = islands (Lab 16)     React renders the WHOLE page            React renders; AEM has no idea about pages
 author edits in Page Editor  author edits in Page Editor,            authors edit forms (Fragment Editor);
                              looking at your React app               layout is in code
```

Adobe's reference lists these meta fields: `:type`, `:items` (containers only), `:itemsOrder` ("JSON map objects don't guarantee field order"), `:path`, `:children` (child pages) and `:hierarchyType`. `PageModelManager` loads and keeps the model, a *Model Provider* hands updates to components (conventionally as `cqModel`), and `ComponentMapping` resolves `:type` to a component. In the editor's iframe the document gets a `data-cq-editor` attribute, and containers render a "new component" placeholder (class `new section aem-Grid-newComponent`) so authors can insert components. The `cq-placeholder`/`data-emptytext` markup in this lab is a simplification of the same idea.

Two contracts connect AEM and the SPA:

1. **Data in:** `<page>.model.json` — the tree from Lab 17, now covering a *whole page* including layout.
2. **Editing hooks:** the Page Editor loads your SPA in an iframe, overlays editing handles on elements that carry `data-cq-data-path="<repository path>"`, and tells your app when a component changed so it can refresh just that part.

### 2. The page model, again

```json
{
  ":type": "wknd/components/page", ":path": "/content/wknd/us/en/featured", "title": "Featured adventures",
  ":items": { "root": {
      ":type": "wknd/components/container", ":path": ".../featured/jcr:content/root",
      "gridClassNames": "aem-Grid aem-Grid--12 aem-Grid--default--12",
      "columnClassNames": { "title": "aem-GridColumn aem-GridColumn--default--12", "cards": "…" },
      ":items": { "title": { ":type": "wknd/components/title", ":path": ".../root/title", "text": "Featured adventures", "type": "h1" }, … },
      ":itemsOrder": ["title", "intro", "cards"]
  } },
  ":itemsOrder": ["root"]
}
```

- `:type` is the **resource type** — the same string that tells HTL which script renders the node. In an SPA it tells *you* which React component does.
- `:items` + `:itemsOrder` → children. **Use `:itemsOrder`**: JSON objects do not promise an order, and the editor changes it when authors drag components.
- `:path` is the node's repository path — the **identity** and editing key in this lab. (Adobe's reference describes `:path` as present on items that represent a *page*; the mock puts it on every item so Task 4 can address components. In a real project check what your Core Component version exports before relying on it, and note that the SPA libraries pass the path to components as `cqPath`.)
- `gridClassNames` / `columnClassNames` are the **layout**: authors resize and reorder columns in *Layout mode*; the result is stored on the container and exported here. If you drop these class names (and ship the grid CSS), the editor and the published page disagree.
- Every other property is the component's data: the dialog's fields as the Sling Model exports them.

### 3. `MapTo`: resource type → React component

```tsx
MapTo("wknd/components/title")(Title, {
  emptyLabel: "Title",                       // the placeholder text authors see when the component is empty
  isEmpty: (props) => !props.text?.trim(),   // when is it empty?
});
```

It is only a lookup table with a convention for editing. Remember that:

- A **type string is not a component**: the registry is data. Make it per-app (no module globals — tests, multiple SPAs on a page and hot reload all suffer otherwise).
- Resource types appear in two spellings (`wknd/components/title`, `/apps/wknd/components/title`). Normalise on lookup.
- **Core Components are versioned** (`core/wcm/components/title/v3/title`): each version is a distinct type string you must map.

### 4. Editor mode vs Publish

The same React code runs in both. The page editor needs more DOM than visitors should get:

| | Publish | Page editor |
| --- | --- | --- |
| wrapper with `data-cq-data-path` | no | **yes**, on every editable component |
| empty component | renders what it renders (or nothing) | a **placeholder** (`.cq-placeholder`, text from `data-emptytext`) so the author has something to click |
| unknown component type | nothing (don't leak half-built UI) | a visible "Unmapped component" box |
| how you know | `isInEditor === false` | `isInEditor === true` (the Author renders the SPA with `?wcmmode=edit`) |

Rule of thumb: **never change visitor-visible behaviour based on `isInEditor`** beyond adding the editing hooks. Otherwise authors preview something your visitors never see.

### 5. Updates: addressing and immutability

When an author saves a dialog, the editor does **not** reload the page: it tells the SPA "`…/root/title` changed". The page-model manager refetches that component's model (`…/title.model.json`, Lab 17!) and your app swaps it into the tree. Doing that well needs two properties of your model code:

1. **Address by path.** Every node has a unique `:path`. `findByPath(model, path)` and `applyUpdate(model, path, newNode)` are the whole API.
2. **Don't mutate; share structure.** A new model object where only the ancestors of the changed node are copied lets React skip everything else (`===` on props). Mutating in place hides the change from React; deep-cloning everything re-renders the page for a one-word edit.

### 6. What this costs you (and why Adobe is moving on)

> [!WARNING]
> Adobe's SPA Editor documentation marks the SPA Editor as **deprecated for new projects** and recommends the Universal Editor and the Content Fragment Editor instead. It remains important because existing projects use it — and its page model, `MapTo` and placeholder ideas are what you will be asked to maintain.

- The page editor needs the SPA to load **inside AEM's iframe**: auth cookies, CORS, `Content-Security-Policy: frame-ancestors`, a dev proxy to Author — the setup is half of the effort.
- Every component needs an *editing story* (dialog, empty state, placeholder). Dynamic data from outside AEM does not fit the model (Lab 19 shows a pattern).
- Server-side rendering is not built in; Adobe's answer for the SPA Editor was a separate renderer service. With Next.js you have SSR, but you also need to keep the editor's expectations (path attributes, partial refresh) intact.
- The **Universal Editor** (the newer Adobe editor) takes another approach: any front end, instrumented with `data-aue-*` attributes, edits content (Fragments, pages) in place and writes it back — no page model, no iframe contract. If you are starting a project today, evaluate it before choosing the SPA Editor. If you are *joining* a project, it very likely has an SPA Editor or HTL codebase — hence this lab.

### Check your understanding

1. Why does the model give you `:itemsOrder` when `:items` already contains all children?
2. A component with `text: ""` is on the page. What should visitors see? What should the author see in the editor? Why must the second case exist?
3. What identifies a component in the model, and why is that identifier a path rather than the `id` field?
4. Your `Title` component is mapped under `wknd/components/title`. A page model contains `/apps/wknd/components/title`. What happens without normalisation?
5. Why is `applyUpdate` allowed to share unchanged subtrees with the old model, and why would mutating the old model be wrong?

## The page model you work with

`GET http://localhost:4503/content/wknd/us/en/featured.model.json` — `title`, `intro`, a nested `cards` container with three adventure cards, a card with no fragment chosen, and a `survey` component that no React component is mapped to. The provided [`components.tsx`](./components.tsx) has `Title`, `Text` and an `AdventureCard` stub, and `registerDemoComponents(mapping)` registers them with **your** mapping. Lab 19 turns the card into a real one.

Use the **Publish / Page editor** switch in the workspace to see both renderings.

## Your tasks

### Task 1 — the mapping · [mapping.ts](./mapping.ts) → `createMapping()`

**Works when:** the three *Task 1* tests pass and the workspace stops showing a TODO box.

### Task 2 — children in the author's order · [model.ts](./model.ts) → `childrenOf(model)`

**Works when:** the three *Task 2* tests pass (stale names, `constructor`, missing order list).

### Task 3 — the renderer · [ModelComponent.tsx](./ModelComponent.tsx) → `ModelComponent({ model, mapping, isInEditor })`

The numbered list in the file's comment is the specification. Take care of the difference between a mapped component and a *container*, and between Publish and the editor.

**Works when:** all *Task 3* tests pass and the workspace shows the featured page on Publish (two columns of cards, no survey) and in editor mode (dashed outlines on everything, a "Unmapped component: wknd/components/survey" box and an *Adventure card* placeholder).

### Task 4 — editor updates · [model.ts](./model.ts) → `findByPath(root, cqPath)`, `applyUpdate(root, cqPath, replacement)`

**Works when:** the four *Task 4* tests pass; the second panel of the workspace shows the edited title with *cards subtree reused: true* and *original untouched: true*.

## Acceptance criteria

- `npm test -- 18` passes.
- On Publish the rendered HTML contains no `data-cq-data-path`, no placeholders and no "Unmapped".
- No module-level mutable state in `mapping.ts`.

## Stretch goals

- Add `ModelProvider`-style caching: a `ModelManager` class with `get(path)`, `subscribe(path, listener)` and `update(path, node)` that calls `applyUpdate` and notifies subscribers of that path only.
- Make the unmapped fallback configurable per mapping (`mapping.fallback`).
- Listen for `postMessage` events in the browser as the real editor does (look at the `cq-*` messages in Adobe's `aem-spa-page-model-manager` source) and call your manager.
