## Goal

Labs 17 and 18 *consume* `.model.json`. Here you build the other end: the machinery that turns a Sling Model into that JSON. You will write the Jackson-style **serializer** (what a getter becomes), the **model selection** (which class serves which component, including components that only *inherit* a model), the **delegation pattern** (`@Via(type = ResourceSuperType.class)`, the way every project customises a Core Component) and the **container export** (`:items` / `:itemsOrder`).

After this lab you can look at a `.model.json` and say which class produced each key — and at a model class and say what it publishes to the world.

> [!NOTE]
> Prerequisites: Lab 21 (`adaptTo`) and Lab 22 (models). The engine is provided; you write the exporter parts. The models for this lab are in [models.ts](./models.ts); read them first, they carry the Java they stand for.

## Lecture: from model to JSON

### 1. One annotation, one servlet

```java
@Model(adaptables = Resource.class, adapters = ComponentExporter.class, resourceType = "wknd/components/title")
@Exporter(name = ExporterConstants.SLING_MODEL_EXPORTER_NAME, extensions = ExporterConstants.SLING_MODEL_EXTENSION)  // "jackson", "json"
public class TitleImpl implements Title { … }
```

`@Exporter` registers the model with the **Sling Model Exporter servlet**, which serves the resource at the selector `model` and extension `json`: `/…/title.model.json`. The servlet adapts the resource to the model **selected by the resource type**, hands it to Jackson (`ObjectMapper.writeValueAsString`) and returns the result. There is no template and no hand-written JSON: *the JSON is whatever Jackson makes of the object's public getters*. That is why the export reads like the model and why changing a getter changes the API.

### 2. Jackson, in four rules

| Rule | Example |
| --- | --- |
| A **getter** (`getX()`, or `isX()` returning `boolean`) is a property; fields are ignored when private | `getTitle()` → `"title"` |
| The name is the getter name minus the prefix, **decapitalised** (two leading capitals stay) | `getURL()` → `"URL"`, `getLinkURL()` → `"linkURL"` |
| Annotations override: `@JsonProperty("…")` renames, `@JsonIgnore` hides, `@JsonInclude(NON_NULL)` omits nulls | `getExportedType()` → `":type"` |
| Values: nested beans recursively, lists → arrays, maps → objects, dates → timestamps/ISO per config | a `List<Action>` → `"actions": […]` |

Jackson **includes nulls by default** (`@JsonInclude(Include.ALWAYS)`), which is why exports without the annotation are full of `"description": null`.

> [!WARNING]
> **Every public getter is public API.** HTL-only helpers (`getCssClasses()`), internals (`getResource()`, `getPage()`) and anything personal that a getter returns all land in JSON that is served from Publish to the world. A getter that returns a `Resource`, `Page` or another object with a back reference makes Jackson recurse until it fails (or leak the structure). `@JsonIgnore` is the fix — and a review checklist item.

### 3. Which model for which component?

Many models can exist for one adapter type (`ComponentExporter`): the Core Teaser, your project teaser, a title… The servlet picks by **resource type**. The rule this lab implements:

> Walk the resource's type chain, nearest first (`wknd/components/featured-teaser` → `wknd/components/teaser` → `core/wcm/components/teaser/v2/teaser`); the first type that has a registered model decides.

Three consequences: a project model *beats* the Core one it extends; a proxy component with no model of its own (`featured-teaser`) is served by its parent's; and a component with no model anywhere has no `.model.json` (and is skipped when it is inside a container).

### 4. The delegation pattern

You normally don't re-implement a Core Component's model. You **delegate** to it:

```java
@Model(adaptables = SlingHttpServletRequest.class, adapters = {Teaser.class, ComponentExporter.class},
       resourceType = "wknd/components/teaser")
@Exporter(name = "jackson", extensions = "json")
public class WkndTeaser implements Teaser {

    @Self @Via(type = ResourceSuperType.class)
    private Teaser coreTeaser;                       // the Core model, built for the SAME resource

    @ValueMapValue private String badge;

    @Override public String getTitle()       { return StringUtils.upperCase(coreTeaser.getTitle()); }  // override
    @Override public String getDescription() { return coreTeaser.getDescription(); }                   // delegate
    public String getBadge()                 { return badge; }                                         // extend
    @Override public String getExportedType() { return resource.getResourceType(); }                  // keep the project's type
}
```

`@Via(type = ResourceSuperType.class)` wraps the current resource in a **`ResourceSuperTypeWrapper`**: it is the same content, but `getResourceType()` answers with the *super type*. The framework then selects the implementation registered for the Core type and adapts the wrapper. The two details people forget:

- `getExportedType()` of your model must return the **real** resource's type (`wknd/components/teaser`) — otherwise the JSON says `core/wcm/…/teaser` and your front end can't map it (Lab 18's `MapTo` keys on `:type`).
- Delegating getters you didn't override isn't automatic: each one is a one-liner (or generate them with Lombok's `@Delegate`).

### 5. Containers

A container model also implements `ContainerExporter`: its `getExportedItems()` is a map **name → child model** (only children that *have* a model), and `getExportedItemsOrder()` the names in authoring order. Jackson writes them as `:items` and `:itemsOrder`. That's the entire "page model" of Lab 18: a page is a container whose items are containers whose items are components.

### 6. Compared with GraphQL

Content Fragment GraphQL (Labs 7–15) publishes a **schema generated from a model**; the Sling Model Exporter publishes **whatever the Java object happens to expose**. Neither is wrong, but the second has no schema, no introspection and no field selection: the contract is your getters plus the Core Components version you extend. Treat `:type` and the getter names as an API with consumers and version them accordingly.

### Check your understanding

1. A developer adds `public Resource getResource()` to a model "for the HTL script". What happens to the model's JSON, and which annotation prevents it?
2. Why must `getExportedType()` of a delegating model not simply delegate to the Core model?
3. `wknd/components/featured-teaser` has no Sling Model. Why does `/…/featured-hero.model.json` still work, and what `:type` does it show?
4. What does a container do with a child whose component has no model, and with a child whose model fails to adapt?
5. Why can an `isReady()` method returning a `String` not become a property, while `getReady()` can?

## Try it

In the workspace, three sections (selection, delegation, export) render with your code. Real AEM: any Core Component page — `…/en.model.json`, or `…/jcr:content/root/container/teaser.model.json`.

## Your tasks

### Task 1 — the serializer · [serialize.ts](./serialize.ts) → `serialize(value, registry)`

The full rules are in the doc comment. Work in this order: primitives/null/Date → arrays/maps/plain objects → getters of model instances → `json` config (rename, ignore, include) → the recursion guard.

**Works when:** the *Task 1* tests pass (including *"an ignored getter must not even be called"* and the recursion test).

### Task 2 — model selection · [select.ts](./select.ts) → `selectModel(registry, resource)`

**Works when:** the *Task 2* tests pass; the workspace shows `featured-hero → WkndTeaser`, `heading → Title`, `spacer → no model`.

### Task 3 — delegation · [delegate.ts](./delegate.ts) → `wrapAsSuperType(resource)`

**Works when:** the *Task 3* tests pass, including *"lets the project model delegate to the Core model"* — the first time your serializer-independent code makes `WkndTeaser.getTitle()` return `"LIVE YOUR ADVENTURE"`.

### Task 4 — the export · [container.ts](./container.ts) → `exportResource(resource, registry, context)`

Put the pieces together: select → adapt → serialize → (container) children. Your function is recursive.

**Works when:** the *Task 4* tests pass; the workspace shows the page tree with `:items` / `:itemsOrder`, `hero` with `":type": "wknd/components/teaser"`, and no trace of `spacer` or the price tags.

## Acceptance criteria

- `npm test -- 23-` is green.
- Compare the workspace's export of the page with `http://localhost:4503/content/wknd/us/en/featured.model.json` from the mock AEM (Lab 17): same `:type` / `:items` / `:itemsOrder` structure.

## Stretch goals

- Add `include: "non-empty"` to `Container` and check `:items`. Is an empty container an error or an absence?
- Make `exportResource` accept a `maxDepth` and stop descending past it (the SPA Editor and some front ends fetch deeper levels lazily). What should `:itemsOrder` contain at the cut-off?
- Replace the `ignore` list by an allow-list (`expose: ["getTitle", …]`). Which of the two is safer when a developer later adds a getter for HTL, and what does it cost you?
