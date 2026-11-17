## Answers to the questions

1. The property is missing; the property is there but not convertible (`"abc"`, `""`); the property is a multi-value whose first element is not convertible; (and, if you read a node that is not the one you think it is — e.g. the page instead of `jcr:content` — the property is simply on another node). The caller cannot tell them apart; log with the *path* when it matters.
2. Because nothing fails: a dialog bug that stores `"yes"` renders the component as "not on sale", looks plausible in review, and no test throws. Prefer real checkbox fields (they write booleans) and treat unexpected strings as authoring errors in a model's `@PostConstruct`.
3. Sling resolves HTL scripts through the super type chain: if `/apps/wknd/components/teaser` has no `teaser.html`, the one from `core/wcm/components/teaser/v2/teaser` is used. Same for the dialog (via the Sling Resource Merger) and for the Sling Model, which is selected by resource type (Lab 23).
4. The one found first on the search path: `/apps` is before `/libs`, so an `/apps` overlay shadows `/libs`. (Which is exactly why `superTypeOf` in the solution stops at the first component node even when it declares no super type.)
5. On the root page's `jcr:content` (or in a site-level configuration), read through an inheritance value map. A page opts out by setting its own value, e.g. `showSearch=false`: "nearest ancestor with a usable value" means the page's own `false` wins over the root's `true`.

## Walkthrough

### Task 1 — coerce

```ts
null            -> null
array target    -> every element converted; one failure fails all
array value     -> first element
switch (type)   -> string | long | double | boolean | date
```

- The order matters: handle the **array target** first (it must see the original value), then collapse array *values* to their first element.
- `long` accepts integer-looking text only, with a regex; `Number("12.5")` would happily parse and quietly lose the fraction.
- `boolean` is the odd one: *any* string converts, so there is no way to detect garbage. This mirrors `Boolean.valueOf`.
- The function returns `null` for failure instead of throwing, like `ValueMap` — callers (and later the model injector) treat `null` as "not found".

### Task 2 — paths

A single pass over `split("/")` with a stack: skip `""` and `"."`, pop on `".."` (fail when the stack is empty), join at the end. `getParentPath` and `resolvePath` are one-liners on top of it. Normalising *before* checking is the point: `"/content/../etc"` must be seen as `/etc`, not as a path under `/content`. The same idea protects Lab 17's `modelUrl`.

### Task 3 — chain

```ts
type  = relative(resource.getResourceType())
next  = resource.getResourceSuperType()        // the resource's own override or its component's
while (type && !seen(type)) { chain.push(type); type = next; next = superTypeOf(type) }
```

- `superTypeOf` stops at the **first** component node found along the search path (`/apps` before `/libs`), even when that node declares nothing.
- Everything is compared in relative form (`relativeType`), so both spellings work.
- The `!chain.includes(type)` check is the cycle guard. Real Sling has the same protection for exactly this reason.

### Task 4 — inheritance

Walk `page → parent → …`, read `jcr:content` of each, and return the first **converted** non-null value together with the page it came from. Returning the source path is a debugging gift: "why does this page show that footer?" is answered by one property.

## Real-world notes

- **Core Components v2/v3** use the Content Policies and `InheritedValueMap` for things like the header/footer Experience Fragment path. The mechanism is the one in Task 4.
- **`ValueMap` vs the model:** Sling Models' `@ValueMapValue` uses these same conversions (Lab 21). A `@ValueMapValue Double amount` on a node containing `"abc"` is "not found" and, with the default *required* strategy, the whole model fails to adapt.
- **Resource Merger:** the dialog and node overlays of `/apps` over `/libs` are merged by the Sling Resource Merger (`sling:hideProperties`, `sling:orderBefore` …), which is separate from the *resource type* inheritance in Task 3.
