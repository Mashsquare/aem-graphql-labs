## Goal

Every Sling Model starts from a **resource**. Before you write `adaptTo`, you should be able to look at a node in CRXDE and say what a model will *see*: which properties, as which Java types, which component it belongs to and what it inherits. This lab rebuilds the four Sling building blocks that models stand on, in TypeScript:

1. `ValueMap` type conversion — the reason `"1450"` can become a `Double` and `"yes"` becomes `false`.
2. Repository paths.
3. Resource types and the **super type chain** — how `wknd/components/teaser` extends a Core Component.
4. **Inherited properties** — how a footer authored on the home page shows up on every page.

Labs 21–23 then build `adaptTo`, real component models and the JSON exporter on this foundation.

> [!NOTE]
> The labs use a small TypeScript model of the Sling API (`src/lib/sling/`): `Resource`, `ValueMap` and `ResourceResolver` have the same method names as the Java interfaces. Everything runs in Node — no AEM, no internet. The Java you would write for real is shown next to each concept. The conversion rules are a *simplified* version of Sling's: when you rely on an edge case in a real project, test it on your SDK.

## Lecture: what a Sling Model sees

### 1. Everything is a resource

Sling maps a URL to a **resource**, and a resource is (usually) a JCR node. The repository is a tree; nodes have **properties**; child nodes are other resources. CRXDE Lite and `…/en.infinity.json` show it as nested JSON — which is exactly how this lab's fixture is written (`src/lib/sling/fixtures.ts`):

```json
{
  "hero": {
    "sling:resourceType": "wknd/components/teaser",
    "jcr:title": "Live your adventure",
    "actionsEnabled": "true",
    "image":   { "fileReference": "/content/dam/…/bali.jpg", "alt": "Surfer" },
    "actions": { "item0": { "text": "Browse adventures", "link": "/content/…/adventures.html" } }
  }
}
```

An object is a **child resource** (`image`, `actions`, `actions/item0`); everything else is a **property**. Dialogs write properties; *multifields* write child nodes (`item0`, `item1`, …) or multi-value properties, depending on how the dialog is built.

```java
Resource hero = resolver.getResource("/content/wknd/us/en/jcr:content/root/container/hero");
Resource image = hero.getChild("image");                 // relative path; null when absent
for (Resource action : hero.getChild("actions").getChildren()) { … }
```

### 2. ValueMap: typed access to untyped storage

JCR properties have types (String, Long, Double, Boolean, Date, and arrays of them) but **nothing forces them to match what your code expects**: authors type `1450` into a text field, an import writes `"true"` as a string, a migration leaves `amount` empty. `ValueMap` converts on read:

```java
ValueMap props = resource.getValueMap();
Double amount   = props.get("amount", Double.class);      // null if missing OR not convertible
String currency = props.get("currency", "USD");            // type comes from the default; default if null
String[] tags   = props.get("cq:tags", String[].class);    // scalar -> one-element array
```

Three behaviours that surprise people:

| You read | The node has | You get | Why it matters |
| --- | --- | --- | --- |
| `Double` | `"abc"` | `null` | no exception: you must handle `null` (or give a default) |
| `Boolean` | `"yes"` | **`false`** | `Boolean.valueOf("yes")` is `false`, not "invalid". A mis-typed checkbox silently reads as off |
| `String` | `["a","b"]` | `"a"` | a multi-value read as a scalar gives the first element, silently |

*Missing* and *unconvertible* look the same to the caller (`null`). That is the root of most "my component renders nothing" bugs — and what Lab 21 turns into the rule **required property missing ⇒ `adaptTo` returns `null`**.

### 3. Resource types and the super type chain

`sling:resourceType` says which **component** renders a node. A component is itself a node under `/apps` (your code) or `/libs`/`/apps/core/…` (Core Components), and it may extend another:

```
/apps/wknd/components/featured-teaser   sling:resourceSuperType = wknd/components/teaser
/apps/wknd/components/teaser            sling:resourceSuperType = core/wcm/components/teaser/v2/teaser
/libs/core/wcm/components/teaser/v2/teaser
```

This is the **Proxy Component pattern**: you do not copy a Core Component, you create a thin component that *extends* it, and inherit its HTL, dialog **and Sling Model** (Lab 23). Rules to know:

- Relative types (`wknd/components/teaser`) are resolved through the **search path**, `/apps` first, then `/libs`. The first component found wins — that is how `/apps` overlays `/libs`. Absolute types (`/apps/wknd/components/teaser`) skip the search.
- `/apps/wknd/components/teaser` and `wknd/components/teaser` are the **same** type. Compare after normalising.
- A *resource* can override the super type with its own `sling:resourceSuperType` property; that applies to its first hop only.
- `resource.isResourceType("core/wcm/components/teaser/v2/teaser")` is true for every component in the chain. It's what HTL scripts and Models use to ask "is this *a* teaser?".
- Chains can be broken (A → B → A). Production code must not loop forever.

### 4. Inherited properties

Site-wide settings live once, on a high page, and every page below reads them via an inheritance value map (`HierarchyNodeInheritanceValueMap`, Core Components' `InheritedValueMap`, or `PageManager` ancestors):

```java
InheritanceValueMap inherited = new HierarchyNodeInheritanceValueMap(page.getContentResource());
String footer = inherited.getInherited("footerText", String.class);   // nearest ancestor that has it
```

"Has it" means "has a usable value": an ancestor whose value cannot be converted does not stop the search.

### Check your understanding

1. `get("amount", Double.class)` returns `null`. Name three different node states that produce this.
2. Why does `Boolean.valueOf("yes")` returning `false` make a checkbox bug hard to notice?
3. Your project component `wknd/components/teaser` has no HTL script of its own. Why does it still render?
4. `/libs/core/…/teaser` and `/apps/core/…/teaser` both exist. Which one does `core/wcm/components/teaser/v2/teaser` resolve to?
5. Where in the repository would you put the "show search" switch so that every page inherits it, and how can a single page opt out?

## Try it

Open the **Your workspace** tab. Each section renders with *your* functions; a section shows a TODO until you implement it. Real AEM: open CRXDE Lite (`/crx/de`) on a local SDK, look at `/content/wknd/…/jcr:content`, and `/apps/<project>/components`.

## Your tasks

### Task 1 — `ValueMap` conversion · [coerce.ts](./coerce.ts) → `coerce(value, type)`

The rule table is in the file's doc comment. Pay attention to `long` vs `double` and the `boolean` rule.

**Works when:** the *Task 1* table passes and the workspace shows `null` for `"abc"` and `false` for `"yes"`.

### Task 2 — paths · [paths.ts](./paths.ts) → `normalizePath`, `getParentPath`, `resolvePath`

**Works when:** the *Task 2* tests pass. Do not use `node:path` (it is OS-dependent and does not know about the root rule).

### Task 3 — the super type chain · [supertype.ts](./supertype.ts) → `superTypeOf`, `typeChain`, `isResourceType`

**Works when:** the *Task 3* tests pass, including the cycle and the resource-level override. The workspace shows `featured-hero → teaser → Core teaser`.

### Task 4 — inherited properties · [inherit.ts](./inherit.ts) → `inheritedProperty(page, name, type)`

**Works when:** the *Task 4* tests pass; `/adventures/bali-surf-camp` gets its footer from the site root, `/about` from itself.

## Acceptance criteria

- `npm test -- 20-` is green.
- You can explain, for each row of the table in §2, what a Sling Model field typed `Double` / `boolean` / `String` would contain.

## Stretch goals

- Add `"date"` support to `inheritedProperty` and read `cq:lastModified` from a page.
- Make `typeChain` return the *absolute* path of each component (`/apps/…` or `/libs/…`) — what would that tell you in a debugging session?
- Write `resolveInheritedBoolean(page, name, default)` and decide: if the page sets `showSearch=false`, should the root's `true` win? (Hint: why does "has a value" mean *converted* value, and what does that imply for `false`?)
