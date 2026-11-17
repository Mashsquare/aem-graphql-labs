import { child, defineModel, osgiService, scriptVariable, self, valueMap, type Resource } from "@/lib/sling";

/* ── Task 2 · PriceTag ── */

export class PriceTag {
  amount = 0;
  currency = "USD";
  sale = false;
  label: string | null = null;
  formatted = "";

  init() {
    this.formatted = `${this.currency} ${this.amount.toFixed(2)}`;
  }
  getAmount() {
    return this.amount;
  }
  getCurrency() {
    return this.currency;
  }
  isSale() {
    return this.sale;
  }
  getLabel() {
    return this.label;
  }
  getFormatted() {
    return this.formatted;
  }
}

export const PriceTagModel = defineModel({
  name: "PriceTag",
  type: PriceTag,
  adaptables: ["resource"],
  // Required by default: the one field that has no default is the one that must exist.
  fields: {
    amount: valueMap("double"),
    currency: valueMap("string", { default: "USD" }),
    sale: valueMap("boolean", { default: false }),
    label: valueMap("string", { optional: true }),
  },
  postConstruct: ["init"],
});

/* ── Task 3 · Teaser ── */

export class ActionItem {
  text!: string;
  link!: string;
  getText() {
    return this.text;
  }
  getLink() {
    return this.link;
  }
  isExternal() {
    return /^https?:\/\//.test(this.link);
  }
}
export const ActionItemModel = defineModel({
  name: "ActionItem",
  type: ActionItem,
  adaptables: ["resource"],
  fields: { text: valueMap("string"), link: valueMap("string") },
});

export class ImageItem {
  fileReference!: string;
  alt = "";
  getFileReference() {
    return this.fileReference;
  }
  getAlt() {
    return this.alt;
  }
}
export const ImageItemModel = defineModel({
  name: "ImageItem",
  type: ImageItem,
  adaptables: ["resource"],
  fields: { fileReference: valueMap("string"), alt: valueMap("string", { optional: true }) },
});

export class Teaser {
  title!: string;
  description = "";
  titleType = "h2";
  linkURL: string | null = null;
  actionsEnabled = false;
  image: ImageItem | null = null;
  actions: ActionItem[] = [];
  externalizer!: { publishLink(path: string): string };
  href: string | null = null;

  init() {
    this.href = this.linkURL ? this.externalizer.publishLink(this.linkURL) : null;
    if (!this.actionsEnabled) this.actions = [];
  }
  getTitle() {
    return this.title;
  }
  getDescription() {
    return this.description;
  }
  getTitleType() {
    return this.titleType;
  }
  getHref() {
    return this.href;
  }
  isActionsEnabled() {
    return this.actionsEnabled;
  }
  getImage() {
    return this.image;
  }
  getActions() {
    return this.actions;
  }
}

export const TeaserModel = defineModel({
  name: "Teaser",
  type: Teaser,
  adaptables: ["resource"],
  defaultInjectionStrategy: "optional",
  fields: {
    title: valueMap("string", { named: "jcr:title", optional: false }), // the one required field
    description: valueMap("string", { named: "jcr:description" }),
    titleType: valueMap("string"),
    linkURL: valueMap("string"),
    actionsEnabled: valueMap("boolean"),
    image: child({ model: ImageItemModel as never }),
    actions: child({ as: "models", model: ActionItemModel as never }),
    externalizer: osgiService("externalizer", { optional: false }),
  },
  postConstruct: ["init"],
});

/* ── Task 4 · Breadcrumb ── */

export interface Crumb {
  title: string;
  href: string;
  active: boolean;
}

const depthOf = (path: string) => path.split("/").filter(Boolean).length;

/** navTitle -> jcr:title -> node name, read from the page's jcr:content. */
export function pageTitle(page: Resource): string {
  const content = page.getChild("jcr:content")?.getValueMap();
  return content?.get("navTitle", "string") ?? content?.get("jcr:title", "string") ?? page.getName();
}

export class Breadcrumb {
  currentPage!: Resource;
  startLevel = 4;
  items: Crumb[] = [];

  init() {
    const trail: Resource[] = [];
    for (let page: Resource | null = this.currentPage; page && depthOf(page.getPath()) >= this.startLevel; page = page.getParent()) {
      trail.unshift(page);
    }
    this.items = trail.map((page) => ({ title: pageTitle(page), href: `${page.getPath()}.html`, active: page.getPath() === this.currentPage.getPath() }));
  }
  getItems() {
    return this.items;
  }
}

export const BreadcrumbModel = defineModel({
  name: "Breadcrumb",
  type: Breadcrumb,
  adaptables: ["request"],
  defaultInjectionStrategy: "optional",
  fields: {
    currentPage: scriptVariable({ optional: false }),
    startLevel: valueMap("long", { default: 4 }),
  },
  postConstruct: ["init"],
});

/* ── Task 5 · Navigation ── */

export interface NavItem {
  title: string;
  href: string;
  children: NavItem[];
}

export class Navigation {
  navigationRoot!: string;
  structureDepth = 2;
  resource!: Resource;
  items: NavItem[] = [];

  init() {
    const root = this.resource.getResourceResolver().getResource(this.navigationRoot);
    if (!root) throw new Error(`navigationRoot ${this.navigationRoot} does not exist`);
    this.items = this.collect(root, this.structureDepth);
  }

  private collect(parent: Resource, depth: number): NavItem[] {
    if (depth < 1) return [];
    return parent
      .listChildren()
      .filter((candidate) => candidate.getChild("jcr:content") !== null)
      .filter((page) => page.getChild("jcr:content")!.getValueMap().get("hideInNav", "boolean") !== true)
      .map((page) => ({ title: pageTitle(page), href: `${page.getPath()}.html`, children: this.collect(page, depth - 1) }));
  }
  getItems() {
    return this.items;
  }
}

export const NavigationModel = defineModel({
  name: "Navigation",
  type: Navigation,
  adaptables: ["resource"],
  defaultInjectionStrategy: "optional",
  fields: {
    navigationRoot: valueMap("string", { optional: false }),
    structureDepth: valueMap("long", { default: 2 }),
    resource: self(),
  },
  postConstruct: ["init"],
});
