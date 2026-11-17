## Answers to the questions

1. Jackson sees a getter returning a `Resource` and tries to serialise it: either it walks the resource's own getters (`getParent()`, `getResourceResolver()` … → infinite recursion or an enormous, internal-structure-leaking payload) or it fails with a mapping exception. `@JsonIgnore` on the getter (mirrored by the `ignore: ["getResource"]` entries in the lab's models) stops it. Better still: don't expose it at all; HTL can use `@Self` or a dedicated getter.
2. Because the Core model sees the *wrapped* resource, whose `getResourceType()` is the super type: it would publish `core/wcm/components/teaser/v2/teaser`, so the front end maps a project component to the Core renderer and the project's changes (and `badge`) are lost. The delegating model answers with its own resource's type.
3. `selectModel` walks the chain `featured-teaser → teaser → core teaser` and the project teaser model is registered for `wknd/components/teaser`. The `:type` is the one of the *resource* (`wknd/components/featured-teaser`), because `getExportedType()` reads the real resource.
4. In both cases the child is simply not in `:items` / `:itemsOrder`. The export of a container is "the children that have a working model". (Which is a feature — and a debugging trap: a missing component in the JSON means either no model or `adaptTo` returned `null`. Lab 21.)
5. Jackson's bean rules say `isXxx()` is a getter only for `boolean`/`Boolean` return types. `getReady()` is a getter for any type.

## Walkthrough

### Task 1 — serialize

```ts
null → null · primitive → itself · Date → ISO
cycle check (ancestors includes value → throw)
array → map · Map → object · plain object → own entries (no functions)
model → for each prototype method matching /^(get|is)([A-Z].*)$/ with no parameters
          · skip if ignored (BEFORE calling it)
          · isX only if it returns boolean
          · serialise the result · drop by include (non-null / non-empty)
          · key = rename[method] ?? decapitalize(rest)
```

- **`ignore` is checked before the call.** Jackson's `@JsonIgnore` never invokes the getter, and the test verifies it with a getter that throws — an expensive or failing getter must not run just to be discarded.
- The recursion guard tracks the **ancestors of the current value**, not "everything seen": the same object appearing twice in sibling positions (a diamond) is legal JSON.
- `decapitalize` is `java.beans.Introspector.decapitalize` — the reason `getURL()` exports as `URL`, not `url`.

### Task 2 — select

The first type of the chain with a registered model wins. Registration order is irrelevant because the chain order decides. Everything is compared in relative form so `/apps/…` and bare spellings match.

### Task 3 — wrap

A `Proxy` answering two methods and forwarding the rest — **bound** to the target, otherwise a method like `getParent()` would run against the proxy and its `this` would be wrong. The second hop (`getResourceSuperType`) is the next element of the chain, so a delegate of a delegate also works.

### Task 4 — export

```ts
def = select(resource) ?? return null
model = adaptTo(resource, def, { ...context, registry }) ?? return null
json = serialize(model)
if (def.container) { items = children.map(export).filter(not null); json[":items"], json[":itemsOrder"] }
```

`registry` must be in the context: the engine needs it to select the Core model while injecting `@Self @Via(ResourceSuperType)`. The recursion is where `null` (no model, or failed adaptation) turns into "child omitted".

## Real-world notes

- **Core Components' delegation docs** describe this pattern for each component and the `ComponentExporter` / `ContainerExporter` interfaces; use the version-specific README of the component you extend. The `Delegate`-style wrapper methods are verbose: Lombok's `@Delegate` is popular for it.
- **`@ExporterOption`** configures the Jackson mapper per model (e.g. `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS`, `MapperFeature.SORT_PROPERTIES_ALPHABETICALLY`). Check which options your Sling Models version supports.
- **Adapters:** `@Model(adapters = {…})` also decides what you can ask for: `resource.adaptTo(ComponentExporter.class)` returns *the selected implementation* — that is what the container uses to export children. This lab's `selectModel` stands in for that selection.
- **Dispatcher and CORS** still decide who can read the JSON (Lab 17). The exporter doesn't know about either.
- **SPA Editor:** the page model of Lab 18 is exactly this export for the page plus the extra editing metadata (`:path`, `cq:*`).
