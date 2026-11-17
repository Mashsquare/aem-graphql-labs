## Answers to the questions

1. Nothing: HTL finds neither `getOnSale()`, `isOnSale()` nor `onSale()` and prints an empty string (and `data-sly-test` is false). Add `public boolean isOnSale()` (or `getOnSale()`). The injected private field is not part of the model's public surface.
2. If the content is bad, `data-sly-use` binds `null`. Without the guard the template still renders its wrapper `<div>` and fixed text, producing an empty, styled shell (and, when the component has editing markup, an authoring placeholder is more appropriate: Core Components use `data-sly-test` with a placeholder template for exactly that).
3. `ValueMap` conversion (Lab 20): `get("sale", Boolean.class)` converts text with `Boolean.valueOf`, so `"true"` becomes `true`. `"yes"` becomes `false` — it does not fail, so the tag silently renders as "not on sale".
4. Throw (so `adaptTo` is `null` and the logs say why) when *configuration* is broken and the component cannot do its job: a navigation root that does not exist, a required service missing. Leave things empty when *content* is merely sparse: no children, no image, no label.
5. `currentPage` is a script binding; bindings exist only for requests. To test it, build the request with a mock (`AemContext`: `context.currentPage(...)`, `context.request()`) — or, better design, make the model read the page from `@Self Resource` (`PageManager.getContainingPage(resource)`) so it also adapts from a plain resource.

## Walkthrough

### Task 1 — HTL

`resolveProperty` is "a lookup with a fallback chain": maps/objects/arrays by key; objects by method name, in the order `getX` → `isX` (only if boolean) → `x`. Two details that the tests lock in:

- The `isX` rule needs the return type check — Jackson uses the same rule, so a method `isValid()` returning a `String` is simply not a property.
- Because the last step is "a method with exactly that name", `model.isSale` resolves to `isSale()`. That's not a bug; people discover it by accident.

`toBoolean` is a `switch` on type. The two non-JavaScript rules are `"false"` ⇒ false and "empty collection/map ⇒ false".

### Task 2 — PriceTag

```ts
adaptables: ["resource"]
fields: amount: valueMap("double")                          // required by default strategy
        currency: valueMap("string", { default: "USD" })
        sale: valueMap("boolean", { default: false })
        label: valueMap("string", { optional: true })
postConstruct: ["init"]
```

Only `amount` has neither a default nor `optional`, so it is the only field that can make the model `null`: with the default (required) strategy this is the least code that expresses the business rule. Alternatively use `defaultInjectionStrategy: "optional"` and `amount: valueMap("double", { optional: false })` — the explicit form is clearer for a reviewer, and it keeps working when a field is added later.

### Task 3 — Teaser

```ts
defaultInjectionStrategy: "optional"
title: valueMap("string", { named: "jcr:title", optional: false })    // @Required
image: child({ model })                    // model adapted from the "image" child, absent/invalid -> field stays null
actions: child({ as: "models", model })    // children of "actions", each adapted; bad ones dropped
externalizer: osgiService("externalizer", { optional: false })
```

Why `image` and `actions` don't kill the teaser: they are optional, and `injectChild` drops children that don't adapt. The teaser is content-first: a broken action costs you the action, not the page section. `init()` (given) applies the *derived* rules: route mapping through the externalizer, and hiding actions when the dialog switch is off.

### Task 4 — Breadcrumb

Walk up from `currentPage` while the path depth is at least `startLevel`, `unshift` each page, then map. `pageTitle` (`navTitle` → `jcr:title` → name) is separate because Navigation needs it too. Depth by counting non-empty segments is crude but exact for `/content/...` paths.

### Task 5 — Navigation

```ts
root = resolver.getResource(navigationRoot) ?? throw        // broken configuration => no model
collect(parent, depth): depth < 1 ? [] : parent.listChildren()
    .filter(has "jcr:content")                              // pages only
    .filter(hideInNav coerced to boolean !== true)          // true AND "true"
    .map(title, href, children = collect(page, depth - 1))
```

Reading `hideInNav` through `get(…, "boolean")` is what makes both the boolean and the text variant work.

## Real-world notes

- **Use the Core Components first.** Breadcrumb, Navigation, Teaser and Title ship as Core Components with tested models; you extend them with the proxy/delegation pattern (Lab 23) rather than rewriting. Writing a model from scratch is for components without a Core equivalent — a price tag, a store locator, a booking widget.
- **`Page`/`PageManager` APIs** hide the `jcr:content` detail (`page.getNavigationTitle()`, `page.isHideInNav()`, `page.listChildren()`). The fixtures here use raw `Resource` on purpose.
- **Don't expose `Resource` or `Page` from getters** if the model is exported as JSON: the exporter would try to serialise them (Lab 23).
- **Caching:** a model is built per request/use; expensive navigation trees are normally cached at the Dispatcher (page level) or in an OSGi service, never in the model instance.
