## Vocabulary

| Term | Meaning |
| --- | --- |
| **JCR / repository** | the tree of nodes and properties that holds all content. Pages, components and DAM assets are nodes |
| **Resource** | a node as Sling sees it. A URL resolves to a resource |
| **`sling:resourceType`** | property that says *which component renders this node*, e.g. `wknd/components/title` (in JSON: `:type`) |
| **Component** | a folder under `/apps/<project>/components/…`: HTL script, dialog, clientlibs, optionally a Sling Model |
| **Dialog** | the form authors fill in. It writes properties onto the component's node |
| **HTL** | HTML Template Language (was *Sightly*): the server-side template language |
| **Sling Model** | Java class adapted from a resource; supplies data to HTL and (with the Exporter) to JSON |
| **Core Components** | Adobe's open-source, versioned component library (Title, Text, Image, Teaser, Container …) |
| **Client library (clientlib)** | JS/CSS bundle served from `/etc.clientlibs/…`; where your React bundle lives in an HTL site |
| **Dispatcher** | Apache module that caches Publish output and filters requests |
| **Author / Publish** | editing instance / serving instance. *Activate* (publish) replicates content from one to the other |
| **Page editor** | the WYSIWYG authoring UI. Finds components through `data-cq-data-path` |
| **Experience Fragment** | reusable chunk of page (header, footer, promo) |
| **Content Fragment** | structured, model-based content (the GraphQL labs) |

## Request flow

```
GET /content/wknd/us/en/featured.html
  → Dispatcher cache? hit → done
  → Publish JVM: resolve resource → sling:resourceType → /apps/wknd/components/page/page.html (HTL)
      → for each child resource: data-sly-resource → that component's HTL ← Sling Model ← node properties
```

## HTL on one screen

```html
<div data-sly-use.model="com.wknd.core.models.Card" data-sly-test="${model.title}" class="cmp-card">
  <h3>${model.title}</h3>                                 <!-- escaped for text -->
  <a href="${model.link}">${'Open' @ i18n}</a>            <!-- URI-checked -->
  <div>${model.body @ context='html'}</div>               <!-- XSS-filtered rich text -->
  <ul data-sly-list="${model.tags}"><li>${item}</li></ul>
  <sly data-sly-resource="${'image' @ resourceType='wknd/components/image'}"/>
  <div data-react-component="Card" data-sale="${model.sale}"></div>   <!-- true: bare attribute, false: no attribute -->
</div>
```

| Context | Use for |
| --- | --- |
| `text` (default in element content) | plain text |
| `attribute` (default in attributes) | attribute values |
| `uri` | `href`, `src` |
| `html` | rich text, **filtered** |
| `scriptString`, `scriptToken`, `styleString` | values inside JS/CSS |
| `unsafe` | **no escaping**; only for output you already made safe (JSON in a `<script>`) |

## Handing data to React

| Pattern | Markup | Props arrive as |
| --- | --- | --- |
| Data attributes | `data-amount="1450" data-sale` | `dataset.amount === "1450"`, `dataset.sale === ""`; `false` → attribute missing |
| JSON attribute | `data-props="{&#34;a&#34;:1}"` | `JSON.parse(dataset.props)` (typed) |
| JSON script | `<script type="application/json" id="p1">{…}</script>` | `JSON.parse(document.getElementById("p1").textContent)` |
| Fetch | `data-src="/content/….model.json"` | `fetch(...)` after mount |

## Model JSON URLs

| URL | Returns |
| --- | --- |
| `<page>.model.json` | whole page model (`:items`, `:itemsOrder`, `:type`, `:path`) |
| `<page>/jcr:content/root/…/<component>.model.json` | one component |
| `.infinity.json`, `.tidy.json`, `.1.json` | raw repository dump — **blocked on Publish**, never build on it |
| `<page>.html?wcmmode=disabled` | on Author: page without editing markup |

## Page model fields

| Field | Meaning |
| --- | --- |
| `:type` | resource type → React component |
| `:path` | repository path = identity, edit key (`data-cq-data-path`) |
| `:items`, `:itemsOrder` | children and their order |
| `gridClassNames`, `columnClassNames` | responsive grid / layout classes |
| `id` | stable DOM id |
| everything else | the component's exported properties |

## Choosing an approach

| You have | Use | Lab |
| --- | --- | --- |
| HTL site, one interactive widget | React island | 16 |
| HTL/Core Components site, a separate front end wants the content | `.model.json` + adapter layer | 17 |
| React owns the page, authors use the Page Editor | SPA Editor | 18 |
| Layout in pages, shared content in fragments | page model + GraphQL | 19 |
| Content for many channels, no page layout | Content Fragments + GraphQL | 7–15 |

## Things that go wrong

- A `false` HTL boolean is a **missing** attribute; a `true` is an **empty** one.
- `.model.json` rich text is **not** XSS-filtered; HTL's `@ context='html'` is.
- Link properties are **repository paths**; map them to routes.
- `javascript:` in an author-entered link is not blocked by React.
- Two spellings of a resource type: `x/y/z` and `/apps/x/y/z`.
- Core Component versions change the JSON; put an adapter between the export and your components.
- HTL pages are cached by the Dispatcher: props are a snapshot.

## Sling Models on one screen

```java
@Model(adaptables = {Resource.class, SlingHttpServletRequest.class},
       adapters = ComponentExporter.class, resourceType = "wknd/components/teaser",
       defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)       // default strategy is REQUIRED
@Exporter(name = "jackson", extensions = "json")                           // -> <resource>.model.json
public class WkndTeaser implements Teaser {
    @ValueMapValue(name = "jcr:title") @Default(values = "Untitled") private String title;
    @ChildResource private List<Action> actions;                           // children of the "actions" node
    @Self @Via(type = ResourceSuperType.class) private Teaser coreTeaser;  // delegation to the Core model
    @OSGiService private Externalizer externalizer;
    @ScriptVariable private Page currentPage;                              // request adaptable only
    @PostConstruct protected void init() { … }                             // after ALL injections
}
```

| Question | Answer |
| --- | --- |
| When does `adaptTo` return `null`? | adaptable not in `adaptables`; a *required* injection found nothing (missing **or** unconvertible); `@PostConstruct` threw |
| What does `${model.sale}` call in HTL? | `getSale()` → `isSale()` (boolean) → `sale()`; never a field |
| HTL truthiness | `0`, `""`, `"false"`, `null`, empty list/map → false; `"0"`, `"no"` → true |
| `ValueMap.get("x", Boolean.class)` on `"yes"` | `false` (not `null`) |
| What ends up in `.model.json`? | every public getter (`getX`, `isX` boolean), minus `@JsonIgnore`; renamed by `@JsonProperty`; nulls included unless `@JsonInclude(NON_NULL)` |
| Which model serves a component? | the nearest type in its `sling:resourceSuperType` chain that has one |
| `:type` of a delegating model | must be the **real** resource's type, not the Core one |

Labs 20–23 build each of these from scratch.
