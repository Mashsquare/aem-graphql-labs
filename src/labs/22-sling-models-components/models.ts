/**
 * Tasks 2–5 — four component models.
 *
 * Tasks 2 and 3 are *declarations*: choose adaptables, strategy and the right "annotation" for each field.
 * Tasks 4 and 5 are *logic*: the `@PostConstruct` method of a model that walks the repository.
 * The classes (fields + getters) are given — they are what HTL and the exporter see.
 */
import { child, defineModel, osgiService, scriptVariable, self, valueMap, type Resource } from "@/lib/sling";

/* ────────────────────────────────────────────────── Task 2 · PriceTag ── */

/**
 * `wknd/components/pricetag` — properties: amount ("1450" or 99.5, a string in some nodes), currency, sale, label.
 *
 * Business rules:
 *   - A price tag without a usable amount must not exist (adaptTo -> null). "abc" is not usable.
 *   - currency defaults to "USD"; sale defaults to false ("true" as TEXT must still read as true); label is optional.
 *   - Adaptable from a resource.
 */
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
  adaptables: [], // TODO Task 2
  fields: {}, // TODO Task 2: amount, currency, sale, label — and don't forget postConstruct: ["init"]
});
void valueMap;

/* ─────────────────────────────────────────────────────── Task 3 · Teaser ── */

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
/** Provided: an action needs both a text and a link. */
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
/** Provided. */
export const ImageItemModel = defineModel({
  name: "ImageItem",
  type: ImageItem,
  adaptables: ["resource"],
  fields: { fileReference: valueMap("string"), alt: valueMap("string", { optional: true }) },
});

/**
 * `wknd/components/teaser`. Dialog properties (Core Components naming):
 *   jcr:title (REQUIRED — a teaser without a title must not adapt) · jcr:description (default "") · titleType (default "h2")
 *   linkURL (optional repository path) · actionsEnabled (boolean, default false)
 * Child nodes: `image` (optional, adapt to ImageItemModel) and `actions` (the CHILDREN of this node, each an ActionItemModel; default []).
 * Service: the `externalizer` (required).
 *
 * `init()` below turns the repository path into a route, and hides actions when they are disabled.
 * Adaptable from a resource.
 */
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
  adaptables: [], // TODO Task 3
  fields: {}, // TODO Task 3 (hint: child({ as: "models", model: … }), osgiService("externalizer"), valueMap("string", { named: "jcr:title" }))
  postConstruct: ["init"],
});
void child;
void osgiService;

/* ───────────────────────────────────────────────────── Task 4 · Breadcrumb ── */

export interface Crumb {
  title: string;
  href: string;
  active: boolean;
}

/**
 * `wknd/components/breadcrumb` — adapted from the REQUEST: `currentPage` is a script binding (the page being rendered),
 * `startLevel` a property of the component (default 4 = the number of path segments of the first page to show:
 * /content/wknd/us/en has four).
 */
export class Breadcrumb {
  currentPage!: Resource;
  startLevel = 4;
  items: Crumb[] = [];

  /**
   * Task 4: fill `this.items` — from the page at depth `startLevel` down to `currentPage`, in that order.
   *   - depth of a page = number of non-empty segments in its path; walk up with `getParent()` while depth >= startLevel
   *   - title: `navTitle`, else `jcr:title`, else the node name — all read from the page's `jcr:content`
   *   - href: the page path + ".html"
   *   - `active` is true only for the current page
   *   - if `currentPage` is above `startLevel`, items stays empty
   */
  init() {
    void this.currentPage;
    this.items = []; // TODO Task 4
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

/* ───────────────────────────────────────────────────── Task 5 · Navigation ── */

export interface NavItem {
  title: string;
  href: string;
  children: NavItem[];
}

/**
 * `wknd/components/navigation` — properties: navigationRoot (a page path, required), structureDepth (default 2).
 * Adapted from the component resource; `self()` gives access to the resolver.
 */
export class Navigation {
  navigationRoot!: string;
  structureDepth = 2;
  resource!: Resource;
  items: NavItem[] = [];

  /**
   * Task 5: fill `this.items` with the child PAGES of the root page, `structureDepth` levels deep.
   *   - resolve the root with `this.resource.getResourceResolver().getResource(this.navigationRoot)`; none -> throw
   *     (a @PostConstruct that throws means "no model": the component must not render with a broken root)
   *   - a child is a page when it has a `jcr:content` child (the `jcr:content` node itself is not a page)
   *   - skip pages whose `jcr:content` has `hideInNav` true — it can be `true` or the text "true"
   *   - title as in the breadcrumb (navTitle → jcr:title → name); href = path + ".html"
   *   - `structureDepth` 1 = only the root's children, 2 = also their children (`children: []` at the last level)
   */
  init() {
    void this.resource;
    this.items = []; // TODO Task 5
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
