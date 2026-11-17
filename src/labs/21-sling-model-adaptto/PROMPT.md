## Goal

`resource.adaptTo(Card.class)` looks like magic: a plain Java class comes back with its fields filled from the repository. It isn't. It is a small, predictable algorithm — and nearly every "my component is empty" bug in an AEM project is a case of that algorithm returning `null`. In this lab you **write the algorithm**: the injectors for each annotation and the `adaptTo` loop that decides when a model exists.

When you finish you will be able to read any `@Model` class and say exactly when it adapts, when it returns `null`, and what its fields contain.

> [!NOTE]
> Prerequisite: Lab 20 (`Resource`, `ValueMap`, conversion). The runtime types are in `src/lib/sling/`. In Java the model is a class with annotations; here it is a class plus a `defineModel({...})` declaration that carries the same information (TypeScript cannot read annotations on fields at runtime). Every builder has the annotation it stands for in its doc comment.

## Lecture: how `adaptTo` works

### 1. The shape of a Sling Model

```java
@Model(
    adaptables = {Resource.class, SlingHttpServletRequest.class},
    resourceType = "wknd/components/teaser",
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class Teaser {

    @ValueMapValue(name = "jcr:title") @Default(values = "Untitled")
    private String title;

    @ValueMapValue
    private boolean actionsEnabled;

    @ChildResource(name = "image")
    private Resource image;

    @ChildResource(name = "actions")
    private List<Action> actions;              // each child of "actions" adapted to Action

    @OSGiService
    private Externalizer externalizer;

    @ScriptVariable
    private Page currentPage;                  // only when adapted from a request

    private String linkLabel;

    @PostConstruct
    protected void init() {                    // runs after ALL injections
        linkLabel = "Read more about " + title;
    }

    public String getTitle() { return title; } // HTL: ${model.title}
}
```

and how you ask for one:

```java
Teaser teaser = resource.adaptTo(Teaser.class);       // null when it cannot be created
Teaser teaser = request.adaptTo(Teaser.class);        // request adaptable
```

In HTL, `data-sly-use.model="com.wknd.core.models.Teaser"` does the same for you: the Sling Models *Use Provider* adapts the current request (or, if the model only lists `Resource`, the current resource).

### 2. The algorithm

For `adaptTo(adaptable, Model)` Sling does, in order:

1. **Can this adaptable be adapted?** The model's `adaptables` must include the adaptable's type, otherwise `null`. (A model that lists only `SlingHttpServletRequest` is `null` when you adapt a `Resource`. This is the most common "works in HTL, null in my unit test" cause.)
2. **Create a new instance.** Models are **not cached or shared**; each `adaptTo` is a new object. (Don't put expensive work in constructors/`@PostConstruct` unless you mean it.)
3. **Inject every annotated field**, by asking *injectors*: "do you have a value for this name and type?" `@ValueMapValue` asks the ValueMap injector, `@ChildResource` the child injector, `@OSGiService` the service registry and so on.
   - found → assign.
   - not found, `@Default` → assign the default.
   - not found, **optional** → leave the field as it is (`null`, `0`, `false`, or its initializer).
   - not found, **required** → **fail: `adaptTo` returns `null`**.
4. **`@PostConstruct` methods run**, superclass first. After *all* fields are set. An exception → `null`.

"Optional or required" comes from the field (`@Optional` / `@Required`) or, if absent, from `defaultInjectionStrategy`. **The default strategy is REQUIRED.** This single default causes a large share of production issues: one new field that old content doesn't have, and every old page silently loses the component.

### 3. The injectors you will write

| Annotation | Reads | Lab builder | Notes |
| --- | --- | --- | --- |
| `@ValueMapValue` (`@Named`) | a property of the resource, **converted** to the field type | `valueMap("string", { named })` | missing *and* unconvertible are the same: "not found" (Lab 20) |
| `@ChildResource` | a child node | `child({ as, model })` | `Resource`, a model, or — for `List<…>` — the *children of* the named node |
| `@Self` | the adaptable itself | `self({ model })` | `@Self Foo foo` = `adaptable.adaptTo(Foo.class)`. Lab 23: `@Via(type = ResourceSuperType.class)` |
| `@OSGiService` | a service from the OSGi registry | `osgiService("externalizer")` | in unit tests you have to supply it (`AemContext.registerService`) |
| `@ScriptVariable` | an HTL/JSP binding (`currentPage`, `properties`, `wcmmode` …) | `scriptVariable()` | **only for request adaptables** |
| `@RequestAttribute` | `request.getAttribute(name)` | `requestAttribute()` | request adaptables only |
| `@Via("jcr:content", type = ChildResource.class)` | *where* to read from: a child of the adaptable instead | `{ via: "jcr:content" }` on any spec | typical for models adapted from a *page* resource that need page properties |

A generic `@Inject` also exists. It asks *all* injectors in service-ranking order, which is slower and ambiguous (the same name can be both a property and a child). Prefer the specific annotations.

### 4. Resource or request?

| Adapt from | You get | You lose |
| --- | --- | --- |
| `Resource` | works anywhere: servlets, jobs, other models, unit tests | no `currentPage`, no request attributes, no selectors |
| `SlingHttpServletRequest` | everything the request knows: script bindings, `@RequestAttribute`, `@ScriptVariable`, `@Self SlingHttpServletRequest` | only inside a request |

Value injection works for both (for a request it reads `request.getResource()`). A model that must run in both lists both adaptables and uses `@Optional` on the request-only fields.

### 5. Three more things to know

- **`adaptTo` hides *why*.** `null` doesn't say which field failed. `ModelFactory.createModel(resource, Teaser.class)` throws a descriptive exception (`MissingElementsException`: "Could not inject … field `title`") — use it in tests, or while debugging.
- **Getters are for HTL (and Jackson).** Injected private fields are invisible to a template: HTL calls `getTitle()`/`isActionsEnabled()` (Lab 22). The Exporter serialises getters (Lab 23).
- **A model is for reading.** Don't do remote calls or heavy computation in `@PostConstruct`, and don't mutate the repository from a model.

### Check your understanding

1. A new field `@ValueMapValue private String subtitle;` is added to a model with the default strategy. 300 existing pages have no `subtitle`. What do those pages render, and why does nobody get an error?
2. `@ValueMapValue private Double amount;` on a node with `amount = "abc"`. Required or optional: what's the result of `adaptTo`?
3. A unit test calls `resource.adaptTo(Breadcrumb.class)` and gets `null`; in the browser it works. Name two probable reasons.
4. What is the difference between `@ChildResource private Resource actions;` and `@ChildResource private List<Resource> actions;`?
5. Where does a `@PostConstruct` method read `title` — and what is its value if `title` was optional and absent?

## Try it

The workspace adapts four fixture nodes (`hero`, `no-title-teaser`, `featured-hero`, `price-empty`) to three example models ([examples.ts](./examples.ts)). Read the examples first: `StrictCard` and `LenientCard` are the same class under the two strategies; `HeroModel` combines six kinds of injection.

## Your tasks

All functions are in [injectors.ts](./injectors.ts) except `adaptTo` in [adapt.ts](./adapt.ts). Each injector returns `{ found: true, value }` or `{ found: false }` — it never throws for a missing value.

### Task 1 — `@ValueMapValue` and `@Via` · `baseResource`, `injectValueMap`

**Works when:** the *Task 1* tests pass: `@Named`, conversion (`"true"` → `true`), unconvertible = not found, `via`, and adapting from a request.

### Task 2 — `@ChildResource` · `injectChild`

**Works when:** the *Task 2* tests pass: single child, `List<Resource>`, a nested model, a list of models (unadaptable children dropped).

### Task 3 — the rest · `injectSelf`, `injectService`, `injectScriptVariable`, `injectRequestAttribute`

**Works when:** the *Task 3* tests pass. Remember: script variables and request attributes only exist for requests.

### Task 4 — the algorithm · [adapt.ts](./adapt.ts) → `adaptTo(adaptable, def, context)`

Follow the five steps in the doc comment. Look twice at: default values that are falsy, the order of `@PostConstruct` relative to injection, and "optional" meaning *leave the field alone*.

**Works when:** the *Task 4* tests pass and the workspace table shows `hero → HeroModel: adapted`, `no-title-teaser → HeroModel: null`, and `StrictCard` failing where `LenientCard` succeeds.

## Acceptance criteria

- `npm test -- 21-` is green.
- In the workspace, you can explain every `null` in the table from the model definitions alone.

## Stretch goals

- Return a *reason* instead of `null`: make a `createModel` that throws `MissingElementsException`-like errors naming the field and injector. Which tasks change?
- Add `@PostConstruct` ordering across a base class (superclass methods first). How would `ModelDef` express inheritance?
- Add `@Source("script-bindings")`-style explicit injector selection: `injector: "valueMap"` on a generic `inject()` spec. What do you gain, what do you lose?
