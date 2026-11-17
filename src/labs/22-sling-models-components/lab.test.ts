import { describe, expect, it } from "vitest";
import { adaptTo, CONTAINER, createFixtureResolver, createRepository, fixtureServices, SITE_ROOT, type ModelDef, type Resource, type SlingRequest } from "@/lib/sling";
import { pick } from "@/test/lab";
import * as exerciseHtl from "./htl";
import * as exerciseModels from "./models";
import * as solutionHtl from "@/solutions/22-sling-models-components/htl";
import * as solutionModels from "@/solutions/22-sling-models-components/models";

const { resolveProperty, toBoolean } = pick(exerciseHtl, solutionHtl);
const models = pick(exerciseModels, solutionModels);

const resolver = createFixtureResolver();
const at = (name: string) => resolver.getResource(`${CONTAINER}/${name}`)!;
const page = (suffix: string) => resolver.getResource(`${SITE_ROOT}${suffix}`)!;
const adapt = <T>(adaptable: Resource | SlingRequest, def: ModelDef<T>, services = fixtureServices) => adaptTo(adaptable, def, { services });
const breadcrumbRequest = (currentPage: Resource | undefined, resource: Resource = at("breadcrumb")): SlingRequest => ({
  kind: "request",
  resource,
  attributes: {},
  bindings: currentPage ? { currentPage } : {},
});

describe("Lab 22 · Task 1 · resolveProperty (HTL property access)", () => {
  class Model {
    private readonly title = "hidden field";
    count = 3;
    getTitle() {
      return "from getter";
    }
    isSale() {
      return true;
    }
    isNotBoolean() {
      return "text";
    }
    size() {
      return 7;
    }
    getBoth() {
      return "get wins";
    }
    both() {
      return "exact";
    }
    getNothing() {
      return undefined;
    }
  }
  const model = new Model();

  it("prefers getX(), reads isX() for booleans and falls back to an exact-name method", () => {
    expect(resolveProperty(model, "title")).toBe("from getter");
    expect(resolveProperty(model, "sale")).toBe(true);
    expect(resolveProperty(model, "size")).toBe(7);
    expect(resolveProperty(model, "both")).toBe("get wins");
  });

  it("`${model.isSale}` works too, through the exact-name rule", () => {
    expect(resolveProperty(model, "isSale")).toBe(true);
  });

  it("an isX() that does not return a boolean is not a property", () => {
    expect(resolveProperty(model, "notBoolean")).toBeUndefined();
  });

  it("never reads fields", () => {
    expect(resolveProperty(model, "count")).toBeUndefined();
    expect(resolveProperty(new (class { name = "x"; })(), "name")).toBeUndefined();
  });

  it("reads maps, objects and arrays", () => {
    expect(resolveProperty(new Map([["a", 1]]), "a")).toBe(1);
    expect(resolveProperty({ a: 2 }, "a")).toBe(2);
    expect(resolveProperty(["x", "y"], "1")).toBe("y");
    expect(resolveProperty(["x", "y"], "length")).toBeUndefined();
  });

  it("null and primitives never throw", () => {
    expect(resolveProperty(null, "a")).toBeUndefined();
    expect(resolveProperty(undefined, "a")).toBeUndefined();
    expect(resolveProperty("text", "length")).toBeUndefined();
    expect(resolveProperty(model, "nope")).toBeUndefined();
    expect(resolveProperty(model, "nothing")).toBeUndefined();
  });
});

describe("Lab 22 · Task 1 · toBoolean (HTL truthiness)", () => {
  it.each([
    [null, false],
    [undefined, false],
    [true, true],
    [false, false],
    [0, false],
    [Number.NaN, false],
    [1, true],
    [-1, true],
    ["", false],
    ["false", false],
    ["FALSE", false],
    ["0", true],
    ["no", true],
    ["text", true],
    [[], false],
    [[0], true],
    [new Map(), false],
    [new Map([["a", 1]]), true],
    [new Set(), false],
    [{}, false],
    [{ a: 1 }, true],
    [new Date(0), true],
    [new (class Foo {})(), true],
  ])("%j -> %j", (value, expected) => {
    expect(toBoolean(value)).toBe(expected);
  });
});

describe("Lab 22 · Task 2 · PriceTag", () => {
  it("adapts a clean node", () => {
    const tag = adapt(at("price-early"), models.PriceTagModel)!;
    expect(tag).toBeInstanceOf(models.PriceTag);
    expect(tag).toMatchObject({ amount: 1450, currency: "EUR", sale: true, label: "Early bird", formatted: "EUR 1450.00" });
  });

  it("converts text to the right types and applies defaults", () => {
    expect(adapt(at("price-string-sale"), models.PriceTagModel)).toMatchObject({ amount: 99.5, currency: "USD", sale: true, label: null, formatted: "USD 99.50" });
  });

  it("an unusable or missing amount means no model at all", () => {
    expect(adapt(at("price-broken"), models.PriceTagModel)).toBeNull();
    expect(adapt(at("price-empty"), models.PriceTagModel)).toBeNull();
  });

  it("is a resource model, not a request model", () => {
    expect(adapt(breadcrumbRequest(undefined, at("price-early")), models.PriceTagModel)).toBeNull();
  });

  it("sale reads as false for text that is not 'true' (and the node still adapts)", () => {
    const repo = createRepository({ tag: { amount: 5, sale: "yes" } });
    expect(adapt(repo.getResource("/tag")!, models.PriceTagModel)).toMatchObject({ amount: 5, sale: false });
  });

  it("is readable the way HTL reads it", () => {
    const tag = adapt(at("price-early"), models.PriceTagModel)!;
    expect(resolveProperty(tag, "sale")).toBe(true);
    expect(resolveProperty(tag, "formatted")).toBe("EUR 1450.00");
  });
});

describe("Lab 22 · Task 3 · Teaser", () => {
  it("adapts a fully authored teaser", () => {
    const teaser = adapt(at("hero"), models.TeaserModel)!;
    expect(teaser).toMatchObject({
      title: "Live your adventure",
      titleType: "h1",
      href: "/adventures",
      actionsEnabled: true,
    });
    expect(teaser.description).toContain("Surf, ski, climb");
    expect(teaser.image).toMatchObject({ alt: "Surfer on a wave in Bali" });
    expect(teaser.actions.map((a) => a.text)).toEqual(["Browse adventures", "Surf forecast"]);
    expect(teaser.actions.map((a) => a.isExternal())).toEqual([false, true]);
  });

  it("applies defaults and leaves optional parts out", () => {
    const teaser = adapt(at("featured-hero"), models.TeaserModel)!;
    expect(teaser).toMatchObject({ title: "Featured: Bali Surf Camp", titleType: "h2", href: "/adventures/bali-surf-camp", actionsEnabled: false });
    expect(teaser.image).toBeNull();
    expect(teaser.actions).toEqual([]);
  });

  it("description defaults to an empty string and linkURL to nothing", () => {
    const repo = createRepository({ t: { "jcr:title": "Hi" } });
    expect(adapt(repo.getResource("/t")!, models.TeaserModel)).toMatchObject({ description: "", href: null, titleType: "h2" });
  });

  it("the title is required", () => {
    expect(adapt(at("no-title-teaser"), models.TeaserModel)).toBeNull();
  });

  it("the externalizer service is required", () => {
    expect(adapt(at("hero"), models.TeaserModel, {} as never)).toBeNull();
  });

  it("actions are hidden when actionsEnabled is not true, even if authored", () => {
    const repo = createRepository({
      t: { "jcr:title": "Hi", actionsEnabled: false, actions: { item0: { text: "A", link: "/x" } } },
    });
    expect(adapt(repo.getResource("/t")!, models.TeaserModel)!.actions).toEqual([]);
  });

  it("an action without a link is dropped from the list, the teaser survives", () => {
    const repo = createRepository({
      t: { "jcr:title": "Hi", actionsEnabled: true, actions: { item0: { text: "A", link: "/x" }, item1: { text: "no link" } } },
    });
    expect(adapt(repo.getResource("/t")!, models.TeaserModel)!.actions.map((a) => a.text)).toEqual(["A"]);
  });

  it("an image without a file reference makes the image null, not the teaser", () => {
    const repo = createRepository({ t: { "jcr:title": "Hi", image: { alt: "orphan" } } });
    expect(adapt(repo.getResource("/t")!, models.TeaserModel)!.image).toBeNull();
  });

  it("is readable the way HTL reads it", () => {
    const teaser = adapt(at("hero"), models.TeaserModel)!;
    expect(resolveProperty(teaser, "title")).toBe("Live your adventure");
    expect(resolveProperty(teaser, "actionsEnabled")).toBe(true);
    expect(toBoolean(resolveProperty(teaser, "actions"))).toBe(true);
    expect(toBoolean(resolveProperty(adapt(at("featured-hero"), models.TeaserModel)!, "actions"))).toBe(false);
  });
});

describe("Lab 22 · Task 4 · Breadcrumb", () => {
  const crumbs = (suffix: string) => adapt(breadcrumbRequest(page(suffix)), models.BreadcrumbModel)?.getItems();

  it("lists the trail from the start level to the current page", () => {
    expect(crumbs("/adventures/bali-surf-camp")).toEqual([
      { title: "WKND — Live your adventure", href: `${SITE_ROOT}.html`, active: false },
      { title: "Adventures", href: `${SITE_ROOT}/adventures.html`, active: false },
      { title: "Bali", href: `${SITE_ROOT}/adventures/bali-surf-camp.html`, active: true }, // navTitle wins over jcr:title
    ]);
  });

  it("works for shallow pages", () => {
    expect(crumbs("/about")!.map((c) => c.title)).toEqual(["WKND — Live your adventure", "About us"]);
    expect(crumbs("")).toEqual([{ title: "WKND — Live your adventure", href: `${SITE_ROOT}.html`, active: true }]);
  });

  it("startLevel is a property of the component, read as a number even when stored as text", () => {
    const repo = createRepository({ comp: { startLevel: "5" } });
    const request = breadcrumbRequest(page("/adventures/bali-surf-camp"), repo.getResource("/comp")!);
    expect(adapt(request, models.BreadcrumbModel)!.getItems().map((c) => c.title)).toEqual(["Adventures", "Bali"]);
  });

  it("a page above the start level gives an empty trail", () => {
    const repo = createRepository({ comp: { startLevel: 6 } });
    expect(adapt(breadcrumbRequest(page("/about"), repo.getResource("/comp")!), models.BreadcrumbModel)!.getItems()).toEqual([]);
  });

  it("falls back to the node name when a page has no title", () => {
    const repo = createRepository({ a: { b: { "jcr:content": {} }, c: { "jcr:content": { "jcr:title": "See" } } }, comp: { startLevel: 1 } });
    const request = breadcrumbRequest(repo.getResource("/a/b")!, repo.getResource("/comp")!);
    expect(adapt(request, models.BreadcrumbModel)!.getItems()).toEqual([
      { title: "a", href: "/a.html", active: false },
      { title: "b", href: "/a/b.html", active: true },
    ]);
  });

  it("needs a currentPage binding and a request", () => {
    expect(adapt(breadcrumbRequest(undefined), models.BreadcrumbModel)).toBeNull();
    expect(adapt(at("breadcrumb"), models.BreadcrumbModel)).toBeNull();
  });
});

describe("Lab 22 · Task 5 · Navigation", () => {
  it("lists child pages two levels deep and skips hidden ones", () => {
    expect(adapt(at("navigation"), models.NavigationModel)!.getItems()).toEqual([
      {
        title: "Adventures",
        href: `${SITE_ROOT}/adventures.html`,
        children: [{ title: "Bali", href: `${SITE_ROOT}/adventures/bali-surf-camp.html`, children: [] }],
      },
      { title: "About us", href: `${SITE_ROOT}/about.html`, children: [] },
    ]);
  });

  it("hideInNav works as a boolean (tahoe-ski-trip) and as text (secret-draft)", () => {
    const flat = JSON.stringify(adapt(at("navigation"), models.NavigationModel)!.getItems());
    expect(flat).not.toContain("Tahoe");
    expect(flat).not.toContain("Secret");
  });

  it("structureDepth limits the levels", () => {
    const repo = createRepository({
      nav: { navigationRoot: SITE_ROOT, structureDepth: 1 },
      content: { wknd: { us: { en: { a: { "jcr:content": { "jcr:title": "A" }, b: { "jcr:content": { "jcr:title": "B" } } } } } } },
    });
    expect(adapt(repo.getResource("/nav")!, models.NavigationModel)!.getItems()).toEqual([{ title: "A", href: `${SITE_ROOT}/a.html`, children: [] }]);
  });

  it("the jcr:content node is not a page", () => {
    expect(JSON.stringify(adapt(at("navigation"), models.NavigationModel)!.getItems())).not.toContain("jcr:content");
  });

  it("no model without a navigationRoot, or when the root does not exist", () => {
    const repo = createRepository({ a: {}, b: { navigationRoot: "/content/nowhere" } });
    expect(adapt(repo.getResource("/a")!, models.NavigationModel)).toBeNull();
    expect(adapt(repo.getResource("/b")!, models.NavigationModel)).toBeNull();
  });
});
