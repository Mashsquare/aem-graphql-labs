## Goal

Labs 20 and 21 gave you the machinery. Now you use it the way a project does: write the Sling Models behind four real components — a **price tag**, a **teaser**, a **breadcrumb** and a **navigation** — and learn exactly how an **HTL template** reads them. You will decide, field by field, what is required, what has a default and what is read from where. Those decisions are most of the day-to-day work of an AEM back-end developer.

> [!NOTE]
> The `adaptTo` engine is provided now (`src/lib/sling/adapt.ts` — the same algorithm you wrote in Lab 21). Your work is the **models** and the **HTL property rules**. All the Java you would write is shown in the lecture next to its TypeScript form.

## Lecture: models for components

### 1. HTL → model: what `${model.sale}` really does

```html
<div data-sly-use.model="com.wknd.core.models.PriceTag" data-sly-test="${model}">
  <span class="amount">${model.formatted}</span>
  <span data-sly-test="${model.sale}" class="badge">${model.label || 'Sale'}</span>
</div>
```

`data-sly-use.model="…"` adapts the request (or its resource) to the class and binds the result — which may be **`null`**. `data-sly-test="${model}"` is therefore the guard that makes a component with broken content render *nothing* instead of an empty shell.

`${model.sale}` is not a field read. HTL looks for a **method**:

| Expression | HTL tries, in order |
| --- | --- |
| `${model.sale}` | `getSale()` → `isSale()` → `sale()` |
| `${model.isSale}` | `getIsSale()` → `isIsSale()` → `isSale()` ← found by exact name |
| `${model.title}` | `getTitle()` → `isTitle()` → `title()` |

Consequences: **a private field without a getter is invisible**; a field is not "exposed" by being injected; refactor getter names and templates break silently (HTL prints nothing). HTL also never throws on `null`: `${model.image.alt}` is empty when `image` is `null`.

Truthiness (`data-sly-test`, `?:`, `||`) follows HTL's boolean cast, which is **not** JavaScript's:

| Value | HTL | JS (for contrast) |
| --- | --- | --- |
| `0` | false | false |
| `"0"`, `"no"` | **true** | true |
| `"false"` | **false** | true |
| empty list / map | **false** | `[]` is true |
| `null` | false | false |

So `data-sly-test="${model.count}"` hides the block when the count is `0` — a frequent surprise — and an empty `List` hides it as well, which is convenient.

> [!NOTE]
> Verify against your SDK: these are the rules of the HTL specification as the lab states them; exact edge cases (whitespace in strings, `Map`/`Optional` handling) depend on the HTL engine version.

### 2. Designing the fields

For every field of a model answer three questions:

1. **Where does it come from?** The component's own properties (`@ValueMapValue`), a child node (`@ChildResource`), another model (`@Self` / child adapted), the request (`@ScriptVariable`, `@RequestAttribute`), a service (`@OSGiService`)?
2. **What if it is missing or malformed?** Pick one: *the component must not exist* (required), *use a default* (`@Default`), *leave it empty and handle it in code* (`@Optional`).
3. **What does the template need?** A getter, with the type the template wants — *not* the type you stored.

```java
@Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class PriceTag {
    @ValueMapValue @Required private Double amount;                     // no amount, no price tag
    @ValueMapValue @Default(values = "USD") private String currency;
    @ValueMapValue @Default(booleanValues = false) private boolean sale;
    @ValueMapValue private String label;                                 // optional
    private String formatted;
    @PostConstruct protected void init() { formatted = currency + " " + String.format("%.2f", amount); }
    …getters…
}
```

A good rule: **the strictest field is the one without which the component has no meaning** (a price tag's amount, a teaser's title, a breadcrumb's current page). Everything else is optional or defaulted, because authors *will* leave things empty and old content *will* predate new fields.

### 3. Real component shapes

- **Content components** (price tag, teaser): `Resource` adaptable, values + children. Keep them testable without a request.
- **Request-aware components** (breadcrumb, navigation tied to the current page): adapt from the **request** to read `currentPage` and other bindings.
- **Structure components** (navigation, list): their `@PostConstruct` walks the repository. Use the `Resource` API (`listChildren`, `getChild`, `getParent`, `getValueMap`) or `PageManager`/`Page` when you need page semantics. Be defensive: authors move and delete pages.
- **Failing loudly vs quietly:** a `@PostConstruct` that throws makes `adaptTo` return `null`, so the component renders nothing. Throw when a *configuration* is broken (the navigation root does not exist) so it fails visibly in the logs; do not throw for merely sparse *content*.

### 4. Pages are resources with a `jcr:content` child

A page is `cq:Page` with a `jcr:content` child that holds its properties (`jcr:title`, `navTitle`, `hideInNav`, …). Its *children* are other pages — and also `jcr:content` itself, which is not a page. In real code `Page`/`PageManager` hides this; here you handle it yourself, which is the best way to remember it.

### Check your understanding

1. Your template prints `${model.onSale}` and the model has `private boolean onSale;` with no getter. What does the page show, and what do you have to change?
2. Why is `data-sly-test="${model}"` a good first line of a component template?
3. In `PriceTag`, `sale` is stored as the text `"true"` on some nodes. Which part of the framework makes `isSale()` still return `true`, and what happens for the text `"yes"`?
4. When should a model throw in `@PostConstruct`, and when should it just leave a list empty?
5. A breadcrumb model reads `currentPage`. Why can't it be adapted from a `Resource`, and what would you do to make it unit-testable?

## Try it

The workspace adapts the fixture nodes with your models and prints, for the first two models, what a template author would get from a few HTL expressions. Start with Task 1: until `resolveProperty` works, every `${…}` cell is a TODO.

## Your tasks

### Task 1 — how HTL reads a model · [htl.ts](./htl.ts) → `resolveProperty(target, name)`, `toBoolean(value)`

**Works when:** the *Task 1* tests pass. In the workspace: `${model.isSale}` and `${model.sale}` both print `true`, and `data-sly-test` shows `false` for `0`, `""`, `"false"`, `[]`.

### Task 2 — `PriceTag` · [models.ts](./models.ts) → `PriceTagModel`

Set `adaptables`, the strategy and the four fields (and `postConstruct`). Requirements are in the doc comment on the class.

**Works when:** the *Task 2* tests pass: clean node, text-typed values, defaults, and `price-broken` / `price-empty` → `null`.

### Task 3 — `Teaser` · [models.ts](./models.ts) → `TeaserModel`

Value fields with `@Named("jcr:title")`, a child model, a list of child models and a required OSGi service. Only the title is required.

**Works when:** the *Task 3* tests pass: `hero` is complete, `featured-hero` falls back to defaults, `no-title-teaser` is `null`, a broken action or image does not kill the teaser.

### Task 4 — `Breadcrumb` · [models.ts](./models.ts) → `Breadcrumb.init()`

The definition is given — read it: `currentPage` is a `scriptVariable`, `startLevel` a defaulted value. Write the method.

**Works when:** the *Task 4* tests pass: correct trail and order, `navTitle` before `jcr:title` before the node name, only the last item `active`, `startLevel` respected.

### Task 5 — `Navigation` · [models.ts](./models.ts) → `Navigation.init()`

**Works when:** the *Task 5* tests pass: two levels, hidden pages (`true` **and** `"true"`) skipped, `jcr:content` not listed, broken root ⇒ no model.

## Acceptance criteria

- `npm test -- 22-` is green.
- For each of your four models you can say, from the definition alone, which content makes it `null`.

## Stretch goals

- Give `PriceTag` a second adaptable (`request`) and an optional `@RequestAttribute` `currency` override. What changes for `sale`?
- Make `Navigation.collect` stop at pages the author marks `navRoot` and mark the current page `active` (needs the request).
- Add `getItems()`-style *immutability*: return copies so templates cannot mutate the model. Why does it matter when models are used by both HTL and the exporter (Lab 23)?
