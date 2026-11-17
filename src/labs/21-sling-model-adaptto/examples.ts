/** Provided: example models for the workspace. Read them — they use the same "annotations" you implement. */
import { child, defineModel, osgiService, self, valueMap, type Resource } from "@/lib/sling";

class Action {
  text!: string;
  link!: string;
  getText() {
    return this.text;
  }
  getLink() {
    return this.link;
  }
}
export const ActionModel = defineModel({
  name: "Action",
  type: Action,
  adaptables: ["resource"],
  fields: { text: valueMap("string"), link: valueMap("string") },
});

class Image {
  fileReference!: string;
  alt = "";
}
export const ImageModel = defineModel({
  name: "Image",
  type: Image,
  adaptables: ["resource"],
  fields: { fileReference: valueMap("string"), alt: valueMap("string", { optional: true }) },
});

/** The same class twice: REQUIRED strategy (Sling's default) vs OPTIONAL. Watch which resources adapt. */
class Card {
  title!: string;
  description = "";
  sale = false;
  tags: string[] = [];
}
export const StrictCard = defineModel({
  name: "StrictCard",
  type: Card,
  adaptables: ["resource"],
  fields: {
    title: valueMap("string", { named: "jcr:title" }),
    description: valueMap("string", { named: "jcr:description" }),
    sale: valueMap("boolean"),
  },
});
export const LenientCard = defineModel({
  name: "LenientCard",
  type: Card,
  adaptables: ["resource"],
  defaultInjectionStrategy: "optional",
  fields: {
    title: valueMap("string", { named: "jcr:title", default: "(untitled)" }),
    description: valueMap("string", { named: "jcr:description" }),
    sale: valueMap("boolean", { default: false }),
  },
});

class Hero {
  title!: string;
  image!: unknown;
  actions: unknown[] = [];
  resource!: Resource;
  linkLabel!: string;
  externalizer!: { publishLink(path: string): string };
  href = "";
  init() {
    this.href = this.externalizer.publishLink(this.resource.getValueMap().get("linkURL", "string") ?? "/");
    this.linkLabel = `Read more about ${this.title}`;
  }
}
export const HeroModel = defineModel({
  name: "Hero",
  type: Hero,
  adaptables: ["resource"],
  defaultInjectionStrategy: "optional",
  fields: {
    title: valueMap("string", { named: "jcr:title", optional: false }),
    image: child({ model: ImageModel }),
    actions: child({ as: "models", model: ActionModel }),
    resource: self(),
    externalizer: osgiService("externalizer"),
  },
  postConstruct: ["init"],
});
