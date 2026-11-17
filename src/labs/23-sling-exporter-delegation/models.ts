/**
 * Provided: the exportable models of a tiny "Core Components + project" setup. Read them — they are what
 * your serializer, selector and delegation code will be fed.
 *
 *   core/wcm/components/page/v3/page          Page      (container)
 *   core/wcm/components/container/v1/container Container (container)
 *   core/wcm/components/title/v3/title        Title
 *   core/wcm/components/text/v2/text          Text
 *   core/wcm/components/teaser/v2/teaser      CoreTeaser            <- the "Core Component" model
 *   wknd/components/teaser                    WkndTeaser            <- the project's model: DELEGATES to CoreTeaser
 *   wknd/components/featured-teaser           (no model)            <- inherits WkndTeaser through the super type chain
 */
import { defineModel, ModelRegistry, self, valueMap, type Resource } from "@/lib/sling";

/** `ComponentExporter.getExportedType()`: the resource type, which becomes `":type"` in the JSON. */
const exporter = { rename: { getExportedType: ":type" }, ignore: ["getResource"] };

class Component {
  resource!: Resource;
  getResource() {
    return this.resource; // a bad idea to expose — hence the @JsonIgnore in the model definitions below
  }
  getExportedType() {
    return this.resource.getResourceType();
  }
}

/* ── Core Components ── */

class Page extends Component {
  title: string | null = null;
  getTitle() {
    return this.title;
  }
}
export const PageModel = defineModel({
  name: "Page",
  type: Page,
  adaptables: ["resource"],
  resourceType: "core/wcm/components/page/v3/page",
  container: true,
  defaultInjectionStrategy: "optional",
  fields: { resource: self(), title: valueMap("string", { named: "jcr:title" }) },
  json: { ...exporter, include: "non-null" },
});

class Container extends Component {}
export const ContainerModel = defineModel({
  name: "Container",
  type: Container,
  adaptables: ["resource"],
  resourceType: "core/wcm/components/container/v1/container",
  container: true,
  fields: { resource: self() },
  json: exporter,
});

class Title extends Component {
  text: string | null = null;
  type = "h3";
  getText() {
    return this.text;
  }
  getType() {
    return this.type;
  }
}
export const TitleModel = defineModel({
  name: "Title",
  type: Title,
  adaptables: ["resource"],
  resourceType: "core/wcm/components/title/v3/title",
  defaultInjectionStrategy: "optional",
  fields: { resource: self(), text: valueMap("string", { named: "jcr:title" }), type: valueMap("string") },
  json: exporter,
});

class Text extends Component {
  text = "";
  richText = false;
  getText() {
    return this.text;
  }
  isRichText() {
    return this.richText;
  }
}
export const TextModel = defineModel({
  name: "Text",
  type: Text,
  adaptables: ["resource"],
  resourceType: "core/wcm/components/text/v2/text",
  defaultInjectionStrategy: "optional",
  fields: { resource: self(), text: valueMap("string"), richText: valueMap("boolean", { named: "textIsRich" }) },
  json: exporter,
});

class CoreTeaser extends Component {
  title: string | null = null;
  description: string | null = null;
  linkURL: string | null = null;
  getTitle() {
    return this.title;
  }
  getDescription() {
    return this.description;
  }
  getLinkURL() {
    return this.linkURL;
  }
}
export const CoreTeaserModel = defineModel({
  name: "CoreTeaser",
  type: CoreTeaser,
  adaptables: ["resource"],
  resourceType: "core/wcm/components/teaser/v2/teaser",
  defaultInjectionStrategy: "optional",
  fields: {
    resource: self(),
    title: valueMap("string", { named: "jcr:title" }),
    description: valueMap("string", { named: "jcr:description" }),
    linkURL: valueMap("string"),
  },
  json: { ...exporter, include: "non-null" },
});

/* ── The project's teaser: the delegation pattern ── */

/**
 * Java:
 *   @Model(adaptables = SlingHttpServletRequest.class, adapters = ComponentExporter.class,
 *          resourceType = "wknd/components/teaser")
 *   @Exporter(name = "jackson", extensions = "json")
 *   public class WkndTeaser implements Teaser {
 *       @Self @Via(type = ResourceSuperType.class) private Teaser coreTeaser;   // <- the Core model, for the same resource
 *       @ValueMapValue private String badge;
 *       @JsonIgnore public Teaser getCoreTeaser() …
 *       public String getTitle() { return StringUtils.upperCase(coreTeaser.getTitle()); }   // override
 *       public String getDescription() { return coreTeaser.getDescription(); }               // delegate
 *       public String getBadge() { return badge; }                                           // extend
 *       public String getExportedType() { return resource.getResourceType(); }              // the project type, not the Core one
 *   }
 */
class WkndTeaser extends Component {
  core!: CoreTeaser;
  badge: string | null = null;
  getTitle() {
    return this.core.getTitle()?.toUpperCase() ?? null;
  }
  getDescription() {
    return this.core.getDescription();
  }
  getLinkURL() {
    return this.core.getLinkURL();
  }
  getBadge() {
    return this.badge;
  }
  getCore() {
    return this.core;
  }
}
export const WkndTeaserModel = defineModel({
  name: "WkndTeaser",
  type: WkndTeaser,
  adaptables: ["resource"],
  resourceType: "wknd/components/teaser",
  defaultInjectionStrategy: "optional",
  fields: {
    resource: self(),
    core: self({ viaSuperType: true, optional: false }), // @Self @Via(type = ResourceSuperType.class): required — no Core teaser, no project teaser
    badge: valueMap("string"),
  },
  json: { rename: exporter.rename, ignore: ["getResource", "getCore"], include: "non-null" },
});

export const createRegistry = () => new ModelRegistry([PageModel, ContainerModel, TitleModel, TextModel, CoreTeaserModel, WkndTeaserModel]);
