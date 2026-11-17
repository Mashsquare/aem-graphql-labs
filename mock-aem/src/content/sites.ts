/**
 * The "classic" half of the mock: a small WKND *site* under /content/wknd/us/en.
 *
 * In AEM a page is a tree of resources under `<page>/jcr:content`. Each resource has a
 * `sling:resourceType` that decides how it is rendered. The very same tree is served three ways:
 *
 *   <page>.html          HTL output (server-rendered HTML; custom React components are mount points)
 *   <page>.model.json    Sling Model Exporter / SPA page model (":items", ":itemsOrder", ":type")
 *   <page>/jcr:content/root/...<component>.model.json   one component's model
 *
 * The content is static (it does not follow Author edits) — what matters for the labs is the *shape*
 * of what AEM sends to a front end.
 */
import { DAM_ROOT, uuidFor } from "./helpers";

export const SITE_ROOT = "/content/wknd/us/en";
export const COMPONENTS = "wknd/components";

export interface SiteResource {
  /** Node name, unique among its siblings. */
  name: string;
  /** Short resource type: "title" -> wknd/components/title */
  type: string;
  props: Record<string, unknown>;
  children?: SiteResource[];
}

export interface SitePage {
  path: string;
  title: string;
  description: string;
  template: string;
  lastModified: string;
  /** The `root` container under jcr:content. */
  root: SiteResource;
}

const adventureFragment = (slug: string) => `${DAM_ROOT}/en/adventures/${slug}/${slug}`;

/** A DAM image as the Core Image component exports it. */
function imageProps(slug: string, alt: string, title: string) {
  const assetId = uuidFor(`asset:${DAM_ROOT}/en/adventures/${slug}/${slug}-hero.jpg`);
  const file = `${slug}-hero.jpg`;
  return {
    assetId,
    alt,
    title,
    file,
    width: 2000,
    height: 1333,
  };
}

const container = (name: string, children: SiteResource[], columns = 12): SiteResource => ({
  name,
  type: "container",
  props: { columns },
  children,
});

const OPEN_ROUTE = (slug: string) => `${SITE_ROOT}/adventures/${slug}.html`;

export const pages: SitePage[] = [
  {
    path: SITE_ROOT,
    title: "WKND — Live your adventure",
    description: "Surf, ski, climb and cycle with WKND.",
    template: "landing-page",
    lastModified: "2026-09-02T09:30:00.000Z",
    root: container("root", [
      container("container", [
        {
          name: "hero",
          type: "teaser",
          props: {
            title: "Live your adventure",
            titleType: "h1",
            description: "<p>Surf, ski, climb and cycle. <b>New trips every month.</b></p>",
            linkURL: `${SITE_ROOT}/adventures.html`,
            image: imageProps("bali-surf-camp", "Surfer on a wave in Bali", "Bali Surf Camp"),
            actions: [
              { title: "Browse adventures", url: `${SITE_ROOT}/adventures.html` },
              { title: "Read the magazine", url: `${SITE_ROOT}/magazine.html#latest` },
              { title: "Surf forecast", url: "https://www.surf-forecast.com" },
            ],
          },
        },
        { name: "welcome", type: "title", props: { text: "Welcome to WKND", type: "h2" } },
        {
          name: "intro",
          type: "text",
          props: {
            richText: true,
            text: "<p>We run small-group trips for people who would rather be <i>outside</i>.</p><ul><li>Expert local guides</li><li>Groups of 12 or fewer</li></ul>",
          },
        },
        {
          // What an author gets when they paste from an email: the JSON exporter hands it to you as is.
          name: "promo",
          type: "text",
          props: {
            richText: true,
            text: '<p onclick="steal()">Book now! <a href="javascript:alert(1)">Click here</a></p><script>alert("xss")</script><p>Offer ends <b>soon</b>.</p>',
          },
        },
        {
          name: "banner",
          type: "image",
          props: { ...imageProps("ski-touring-mont-blanc", "Skiers crossing a glacier", "Ski touring"), link: `${SITE_ROOT}/adventures.html` },
        },
      ]),
    ]),
  },
  {
    // Lab 16: a page written the "classic" way — HTL renders HTML and drops React mount points into it.
    path: `${SITE_ROOT}/adventures`,
    title: "Adventures",
    description: "All WKND adventures.",
    template: "content-page",
    lastModified: "2026-09-10T14:00:00.000Z",
    root: container("root", [
      container("container", [
        { name: "title", type: "title", props: { text: "Adventures", type: "h1" } },
        { name: "price-sale", type: "pricetag", props: { amount: 1450, currency: "USD", sale: true, label: "Bali Surf Camp" } },
        { name: "price-regular", type: "pricetag", props: { amount: 2100, currency: "EUR", sale: false, label: "Cycling Tuscany" } },
        { name: "price-free", type: "pricetag", props: { amount: 0, currency: "USD", sale: false, label: "Local meetup" } },
        {
          name: "card-bali",
          type: "adventurecard",
          props: {
            title: "Bali Surf Camp",
            activity: "Surfing",
            price: 1450,
            difficulty: "Beginner",
            detailsUrl: OPEN_ROUTE("bali-surf-camp"),
            tags: ["surfing", "bali", "beginner-friendly"],
          },
        },
        {
          name: "card-hostile",
          type: "adventurecard",
          props: {
            title: "Mystery Trip",
            activity: "Social",
            price: 99,
            difficulty: "Beginner",
            // An author with a dialog field "Link" can type anything into it.
            detailsUrl: "javascript:alert('xss')",
            tags: [],
          },
        },
        { name: "departure", type: "departure", props: { date: "2026-12-04", label: "Next Bali departure", showWeekday: true } },
      ]),
    ]),
  },
  {
    // Labs 18 and 19: the page model of a "hybrid" page — layout from AEM, data from Content Fragments.
    path: `${SITE_ROOT}/featured`,
    title: "Featured adventures",
    description: "Hand-picked adventures.",
    template: "content-page",
    lastModified: "2026-10-01T08:00:00.000Z",
    root: container("root", [
      container("container", [
        { name: "title", type: "title", props: { text: "Featured adventures", type: "h1" } },
        { name: "intro", type: "text", props: { richText: false, text: "Picked by our guides this month." } },
        container(
          "cards",
          [
            { name: "card-one", type: "adventurecard", props: { fragmentPath: adventureFragment("bali-surf-camp"), showPrice: true, layout: "full" } },
            { name: "card-two", type: "adventurecard", props: { fragmentPath: adventureFragment("ski-touring-mont-blanc"), showPrice: false, layout: "compact" } },
            // A draft: exists on Author, resolves to null on Publish.
            { name: "card-draft", type: "adventurecard", props: { fragmentPath: adventureFragment("iceland-northern-lights-trek"), showPrice: true, layout: "full" } },
            // An author dropped a component the SPA has never heard of.
            { name: "survey", type: "survey", props: { question: "Where next?" } },
            // An author added a card but has not picked a fragment yet.
            { name: "card-empty", type: "adventurecard", props: { showPrice: true, layout: "full" } },
          ],
          6,
        ),
      ]),
    ]),
  },
];

/* -------------------------------------------------------------------------- */
/* Lookup                                                                      */
/* -------------------------------------------------------------------------- */

export function findPage(path: string): SitePage | undefined {
  return pages.find((page) => page.path === path);
}

/** Splits "/content/wknd/us/en/featured/jcr:content/root/container/cards" into page + inner path. */
export function resolve(requestPath: string): { page: SitePage; resource: SiteResource; resourcePath: string[] } | null {
  const normalized = requestPath.replace(/\/_jcr_content/, "/jcr:content");
  const [pagePath, inner] = normalized.split("/jcr:content");
  const page = findPage(pagePath);
  if (!page) return null;
  const segments = (inner ?? "").split("/").filter(Boolean);
  if (segments[0] !== undefined && segments[0] !== "root") return null;
  let resource = page.root;
  for (const segment of segments.slice(1)) {
    const next = resource.children?.find((child) => child.name === segment);
    if (!next) return null;
    resource = next;
  }
  return { page, resource, resourcePath: segments };
}

const cqPath = (page: SitePage, resourcePath: string[]) => `${page.path}/jcr:content${resourcePath.length ? `/${resourcePath.join("/")}` : ""}`;

/* -------------------------------------------------------------------------- */
/* Image URLs (Core Image component: /<path>.coreimg{.width}.jpeg/<ts>/<uuid>/<file>)  */
/* -------------------------------------------------------------------------- */

function coreImageTemplate(page: SitePage, resourcePath: string[], image: { assetId: string; file: string }) {
  return `${cqPath(page, resourcePath)}.coreimg{.width}.jpeg/1730000000000/${image.assetId}/${image.file}`;
}

const coreImageSrc = (template: string, width?: number) => template.replace("{.width}", width ? `.${width}` : "");

/* -------------------------------------------------------------------------- */
/* .model.json                                                                  */
/* -------------------------------------------------------------------------- */

const idFor = (page: SitePage, resourcePath: string[]) => `${resourcePath.at(-1) ?? "root"}-${uuidFor(cqPath(page, resourcePath)).slice(0, 8)}`;

type Json = Record<string, unknown>;

function imageModel(page: SitePage, resourcePath: string[], image: { assetId: string; file: string; alt: string; title: string; width: number; height: number }): Json {
  const template = coreImageTemplate(page, resourcePath, image);
  return {
    src: coreImageSrc(template, 1200),
    srcUriTemplate: template,
    alt: image.alt,
    title: image.title,
    widths: [320, 480, 800, 1200, 1600],
    lazyEnabled: true,
    width: image.width,
    height: image.height,
  };
}

export function resourceModel(page: SitePage, resource: SiteResource, resourcePath: string[]): Json {
  const base: Json = { id: idFor(page, resourcePath), ":type": `${COMPONENTS}/${resource.type}` };
  const props = resource.props as Record<string, never>;
  switch (resource.type) {
    case "container": {
      const items: Json = {};
      const columnClassNames: Record<string, string> = {};
      for (const child of resource.children ?? []) {
        items[child.name] = resourceModel(page, child, [...resourcePath, child.name]);
        const columns = child.type === "container" ? 12 : (resource.props.columns as number);
        columnClassNames[child.name] = `aem-GridColumn aem-GridColumn--default--${columns}`;
      }
      return {
        ...base,
        gridClassNames: "aem-Grid aem-Grid--12 aem-Grid--default--12",
        columnClassNames,
        ":items": items,
        ":itemsOrder": (resource.children ?? []).map((child) => child.name),
        ":path": cqPath(page, resourcePath),
      };
    }
    case "title":
      return { ...base, text: props.text, type: props.type, ":path": cqPath(page, resourcePath) };
    case "text":
      return { ...base, text: props.text, richText: props.richText, ":path": cqPath(page, resourcePath) };
    case "image": {
      const image = props as unknown as Parameters<typeof imageModel>[2];
      return { ...base, ...imageModel(page, resourcePath, image), ...(props.link ? { linkURL: props.link } : {}), ":path": cqPath(page, resourcePath) };
    }
    case "teaser": {
      const image = props.image as unknown as Parameters<typeof imageModel>[2];
      const actions = props.actions as unknown as { title: string; url: string }[];
      return {
        ...base,
        title: props.title,
        titleType: props.titleType,
        description: props.description,
        linkURL: props.linkURL,
        actionsEnabled: actions.length > 0,
        actions: actions.map((action, index) => ({ id: `${idFor(page, resourcePath)}-action-${index}`, title: action.title, url: action.url })),
        image: imageModel(page, [...resourcePath, "image"], image),
        ":path": cqPath(page, resourcePath),
      };
    }
    default:
      // Custom components: whatever their Sling Model exports. Unknown types still export something.
      return { ...base, ...resource.props, ":path": cqPath(page, resourcePath) };
  }
}

export function pageModel(page: SitePage): Json {
  return {
    ":type": `${COMPONENTS}/page`,
    ":path": page.path,
    ":hierarchyType": "page",
    title: page.title,
    description: page.description,
    templateName: page.template,
    lastModifiedDate: Date.parse(page.lastModified),
    ":itemsOrder": ["root"],
    ":items": { root: resourceModel(page, page.root, ["root"]) },
  };
}

/* -------------------------------------------------------------------------- */
/* HTL output                                                                   */
/* -------------------------------------------------------------------------- */

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "&#39;");

/**
 * What HTL's `@ context='html'` does for rich text: AEM's XSS API filters the markup. A *JSON* export
 * of the same property is not filtered — that is why Lab 17 makes you sanitise it yourself.
 */
export function xssFilter(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/href="\s*javascript:[^"]*"/gi, 'href="#"');
}

export interface HtlOptions {
  /** Author in edit mode adds data-cq-data-path so the page editor can find components. */
  editMode: boolean;
}

function htlResource(page: SitePage, resource: SiteResource, resourcePath: string[], options: HtlOptions): string {
  const path = cqPath(page, resourcePath);
  const editAttr = options.editMode ? ` data-cq-data-path="${esc(path)}"` : "";
  const props = resource.props;
  const bool = (name: string, value: unknown) => (value ? ` ${name}` : ""); // HTL: true -> bare attribute, false -> omitted
  switch (resource.type) {
    case "container":
      return `<div class="cmp-container"${editAttr}><div class="aem-Grid aem-Grid--12 aem-Grid--default--12">
${(resource.children ?? [])
  .map((child) => {
    const columns = child.type === "container" ? 12 : (resource.props.columns as number);
    return `  <div class="${esc(child.type)} aem-GridColumn aem-GridColumn--default--${columns}">${htlResource(page, child, [...resourcePath, child.name], options)}</div>`;
  })
  .join("\n")}
</div></div>`;
    case "title":
      return `<div class="cmp-title"${editAttr}><${props.type} class="cmp-title__text">${esc(props.text)}</${props.type}></div>`;
    case "text":
      return `<div class="cmp-text"${editAttr}>${props.richText ? xssFilter(String(props.text)) : `<p>${esc(props.text)}</p>`}</div>`;
    case "image": {
      const image = props as unknown as { assetId: string; file: string; alt: string };
      const src = coreImageSrc(coreImageTemplate(page, resourcePath, image), 1200);
      return `<div class="cmp-image"${editAttr}><img class="cmp-image__image" src="${esc(src)}" alt="${esc(image.alt)}" loading="lazy"></div>`;
    }
    case "teaser": {
      const image = props.image as unknown as { assetId: string; file: string; alt: string };
      const src = coreImageSrc(coreImageTemplate(page, [...resourcePath, "image"], image), 1200);
      const actions = props.actions as unknown as { title: string; url: string }[];
      return `<div class="cmp-teaser"${editAttr}><img src="${esc(src)}" alt="${esc(image.alt)}"><${props.titleType} class="cmp-teaser__title"><a href="${esc(props.linkURL)}">${esc(props.title)}</a></${props.titleType}>${xssFilter(String(props.description))}<div class="cmp-teaser__action-container">${actions.map((action) => `<a class="cmp-teaser__action-link" href="${esc(action.url)}">${esc(action.title)}</a>`).join("")}</div></div>`;
    }
    // ---- React mount points: the Sling Model's data goes into data-* attributes -------------------
    case "pricetag":
      // Individual data attributes. HTL renders `${model.sale}` true as a bare attribute and false as no attribute.
      return `<div data-react-component="PriceTag" data-amount="${esc(props.amount)}" data-currency="${esc(props.currency)}"${bool("data-sale", props.sale)} data-label="${esc(props.label)}"${editAttr}></div>`;
    case "adventurecard":
      // One JSON attribute holding everything the Sling Model exports (HTL escapes the quotes for us).
      return `<div data-react-component="AdventureCard" data-props="${esc(JSON.stringify(props))}"${editAttr}></div>`;
    case "departure": {
      // A script tag avoids attribute escaping and size limits for bigger payloads.
      const id = `departure-props-${uuidFor(path).slice(0, 6)}`;
      return `<div data-react-component="Departure" data-props-id="${id}"${editAttr}></div>\n<script type="application/json" id="${id}">${JSON.stringify(props).replace(/</g, "\\u003c")}</script>`;
    }
    default:
      return `<div class="cmp-unknown"${editAttr}><!-- no HTL script for ${esc(resource.type)} --></div>`;
  }
}

export function pageHtml(page: SitePage, options: HtlOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="stylesheet" href="/etc.clientlibs/wknd/clientlibs/clientlib-base.min.css" type="text/css">
</head>
<body class="page basicpage">
<div class="root container responsivegrid">
${htlResource(page, page.root, ["root"], options)}
</div>
<script src="/etc.clientlibs/wknd/clientlibs/clientlib-react.min.js"></script>
</body>
</html>
`;
}
