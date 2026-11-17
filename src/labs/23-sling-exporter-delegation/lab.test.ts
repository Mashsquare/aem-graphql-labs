import { describe, expect, it } from "vitest";
import {
  adaptTo,
  CONTAINER,
  createFixtureResolver,
  createRepository,
  defineModel,
  fixtureServices,
  ModelRegistry,
  SITE_ROOT,
  valueMap,
  type ModelContext,
  type Resource,
} from "@/lib/sling";
import { pick } from "@/test/lab";
import { createRegistry, CoreTeaserModel, WkndTeaserModel } from "./models";
import * as exerciseContainer from "./container";
import * as exerciseDelegate from "./delegate";
import * as exerciseSelect from "./select";
import * as exerciseSerialize from "./serialize";
import * as solutionContainer from "@/solutions/23-sling-exporter-delegation/container";
import * as solutionDelegate from "@/solutions/23-sling-exporter-delegation/delegate";
import * as solutionSelect from "@/solutions/23-sling-exporter-delegation/select";
import * as solutionSerialize from "@/solutions/23-sling-exporter-delegation/serialize";

const { serialize } = pick(exerciseSerialize, solutionSerialize);
const { selectModel } = pick(exerciseSelect, solutionSelect);
const { wrapAsSuperType } = pick(exerciseDelegate, solutionDelegate);
const { exportResource } = pick(exerciseContainer, solutionContainer);

const resolver = createFixtureResolver();
const registry = createRegistry();
const at = (name: string) => resolver.getResource(`${CONTAINER}/${name}`)!;
const hooks = { wrapAsSuperType, selectModel };
const context: ModelContext = { services: fixtureServices, registry, hooks };

describe("Lab 23 · Task 1 · serialize", () => {
  const empty = new ModelRegistry();

  it("exports getters, not fields; names come from the getter, decapitalised", () => {
    class Model {
      secret = "field";
      getTitle() {
        return "T";
      }
      getURL() {
        return "u";
      }
      getX() {
        return 1;
      }
      isSale() {
        return true;
      }
    }
    expect(serialize(new Model(), empty)).toEqual({ title: "T", URL: "u", x: 1, sale: true });
  });

  it("ignores non-getters: wrong prefix, lower-case after the prefix, parameters, isX that is not boolean", () => {
    class Model {
      getOk() {
        return 1;
      }
      compute() {
        return 2;
      }
      getaway() {
        return 3;
      }
      get() {
        return 4;
      }
      getWithArg(a: number) {
        return a;
      }
      isMaybe() {
        return "text";
      }
      init() {
        return 5;
      }
    }
    expect(serialize(new Model(), empty)).toEqual({ ok: 1 });
  });

  it("includes inherited getters", () => {
    class Base {
      getId() {
        return "id";
      }
    }
    class Child extends Base {
      getName() {
        return "n";
      }
    }
    expect(serialize(new Child(), empty)).toEqual({ id: "id", name: "n" });
  });

  it("serialises nested models, arrays, maps, dates and plain objects", () => {
    class Leaf {
      getValue() {
        return 1;
      }
    }
    class Root {
      getLeaf() {
        return new Leaf();
      }
      getLeaves() {
        return [new Leaf(), new Leaf()];
      }
      getMap() {
        return new Map([["k", new Leaf()]]);
      }
      getWhen() {
        return new Date("2026-09-02T09:30:00.000Z");
      }
      getPlain() {
        return { a: 1, f: () => 1, nested: { b: [1, 2] } };
      }
      getNothing() {
        return null;
      }
    }
    expect(serialize(new Root(), empty)).toEqual({
      leaf: { value: 1 },
      leaves: [{ value: 1 }, { value: 1 }],
      map: { k: { value: 1 } },
      when: "2026-09-02T09:30:00.000Z",
      plain: { a: 1, nested: { b: [1, 2] } },
      nothing: null,
    });
  });

  it("applies rename, ignore and include from the model definition", () => {
    class Model {
      getExportedType() {
        return "wknd/x";
      }
      getResource() {
        throw new Error("an ignored getter must not even be called");
      }
      getName() {
        return null;
      }
      getTags() {
        return [];
      }
      getText() {
        return "";
      }
      getKept() {
        return "yes";
      }
    }
    const make = (include?: "always" | "non-null" | "non-empty") =>
      new ModelRegistry([
        defineModel({
          name: "M",
          type: Model,
          adaptables: ["resource"],
          fields: {},
          json: { rename: { getExportedType: ":type" }, ignore: ["getResource"], include },
        }),
      ]);
    expect(serialize(new Model(), make())).toEqual({ ":type": "wknd/x", name: null, tags: [], text: "", kept: "yes" });
    expect(serialize(new Model(), make("non-null"))).toEqual({ ":type": "wknd/x", tags: [], text: "", kept: "yes" });
    expect(serialize(new Model(), make("non-empty"))).toEqual({ ":type": "wknd/x", kept: "yes" });
  });

  it("null and primitives", () => {
    expect(serialize(null, empty)).toBeNull();
    expect(serialize(undefined, empty)).toBeNull();
    expect(serialize("a", empty)).toBe("a");
    expect(serialize(0, empty)).toBe(0);
    expect(serialize(false, empty)).toBe(false);
  });

  it("refuses to recurse forever", () => {
    class Parent {
      getChild(): Child {
        return new Child(this);
      }
    }
    class Child {
      constructor(private readonly parent: Parent) {}
      getParent() {
        return this.parent;
      }
    }
    expect(() => serialize(new Parent(), empty)).toThrow(/recursion/i);
  });

  it("a diamond (the same object twice, not nested in itself) is fine", () => {
    const leaf = { v: 1 };
    class Model {
      getA() {
        return leaf;
      }
      getB() {
        return leaf;
      }
    }
    expect(serialize(new Model(), empty)).toEqual({ a: { v: 1 }, b: { v: 1 } });
  });
});

describe("Lab 23 · Task 2 · selectModel", () => {
  it("returns the model registered for the resource type", () => {
    expect(selectModel(registry, at("heading"))!.name).toBe("Title"); // wknd/components/title -> core title
    expect(selectModel(registry, at("intro"))!.name).toBe("Text");
  });

  it("the nearest type wins: the project model beats the Core model it extends", () => {
    expect(selectModel(registry, at("hero"))!.name).toBe("WkndTeaser");
  });

  it("a proxy component without a model inherits its super type's", () => {
    expect(selectModel(registry, at("featured-hero"))!.name).toBe("WkndTeaser");
  });

  it("components without any model, and broken chains, give null", () => {
    expect(selectModel(registry, at("spacer"))).toBeNull();
    expect(selectModel(registry, at("price-early"))).toBeNull();
    expect(selectModel(registry, at("loop"))).toBeNull();
  });

  it("registration order does not matter, and absolute resource types match", () => {
    const reversed = new ModelRegistry([...registry.all()].reverse());
    expect(selectModel(reversed, at("hero"))!.name).toBe("WkndTeaser");
    const absolute = new ModelRegistry([{ ...CoreTeaserModel, name: "Abs", resourceType: "/libs/core/wcm/components/teaser/v2/teaser" } as never]);
    expect(selectModel(absolute, at("hero"))!.name).toBe("Abs");
  });

  it("models without a resourceType never match", () => {
    expect(selectModel(new ModelRegistry([{ ...CoreTeaserModel, resourceType: undefined } as never]), at("hero"))).toBeNull();
  });
});

describe("Lab 23 · Task 3 · wrapAsSuperType", () => {
  it("claims to be the super type, and one level less for the next hop", () => {
    const wrapped = wrapAsSuperType(at("featured-hero"))!;
    expect(wrapped.getResourceType()).toBe("wknd/components/teaser");
    expect(wrapped.getResourceSuperType()).toBe("core/wcm/components/teaser/v2/teaser");
    const core = wrapAsSuperType(at("hero"))!;
    expect(core.getResourceType()).toBe("core/wcm/components/teaser/v2/teaser");
    expect(core.getResourceSuperType()).toBeNull();
  });

  it("everything else is the original's", () => {
    const hero = at("hero");
    const wrapped = wrapAsSuperType(hero)!;
    expect(wrapped.getPath()).toBe(hero.getPath());
    expect(wrapped.getName()).toBe("hero");
    expect(wrapped.getValueMap().get("jcr:title", "string")).toBe("Live your adventure");
    expect(wrapped.getChild("image")?.getPath()).toBe(`${hero.getPath()}/image`);
    expect(wrapped.listChildren().map((c: Resource) => c.getName())).toEqual(["image", "actions"]);
    expect(wrapped.getParent()?.getPath()).toBe(CONTAINER);
    expect(wrapped.getResourceResolver()).toBe(hero.getResourceResolver());
  });

  it("does not change the original", () => {
    const hero = at("hero");
    wrapAsSuperType(hero);
    expect(hero.getResourceType()).toBe("wknd/components/teaser");
  });

  it("is null when there is no super type", () => {
    expect(wrapAsSuperType(at("price-early"))).toBeNull();
  });

  it("selects the Core model", () => {
    expect(selectModel(registry, wrapAsSuperType(at("hero"))!)!.name).toBe("CoreTeaser");
  });

  it("lets the project model delegate to the Core model", () => {
    const model = adaptTo(at("hero"), WkndTeaserModel, context)!;
    expect(model.getTitle()).toBe("LIVE YOUR ADVENTURE"); // overridden
    expect(model.getDescription()).toContain("Surf, ski, climb"); // delegated
    expect(model.getBadge()).toBeNull(); // added by the project
  });
});

describe("Lab 23 · Task 4 · exportResource", () => {
  it("exports a component through its model", () => {
    expect(exportResource(at("heading"), registry, context)).toEqual({ ":type": "wknd/components/title", text: "Featured adventures", type: "h2" });
    expect(exportResource(at("intro"), registry, context)).toEqual({ ":type": "wknd/components/text", text: "<p>Welcome to <b>WKND</b>.</p>", richText: true });
  });

  it("a delegating model exports Core's data, the project's overrides and ITS OWN type", () => {
    expect(exportResource(at("hero"), registry, context)).toEqual({
      ":type": "wknd/components/teaser",
      title: "LIVE YOUR ADVENTURE",
      description: "<p>Surf, ski, climb and cycle. <b>New trips every month.</b></p>",
      linkURL: "/content/wknd/us/en/adventures.html",
    });
  });

  it("a proxy without its own model exports with the proxy's type", () => {
    expect(exportResource(at("featured-hero"), registry, context)).toMatchObject({
      ":type": "wknd/components/featured-teaser",
      title: "FEATURED: BALI SURF CAMP",
    });
  });

  it("components without a model export nothing", () => {
    expect(exportResource(at("spacer"), registry, context)).toBeNull();
    expect(exportResource(at("price-early"), registry, context)).toBeNull();
  });

  it("containers add :items and :itemsOrder, skipping children that cannot be exported", () => {
    const json = exportResource(resolver.getResource(CONTAINER)!, registry, context)!;
    expect(json[":type"]).toBe("wknd/components/container");
    expect(json[":itemsOrder"]).toEqual(["hero", "no-title-teaser", "featured-hero", "intro", "heading"]);
    expect(Object.keys(json[":items"] as object)).toEqual(json[":itemsOrder"]);
    expect((json[":items"] as Record<string, unknown>).heading).toEqual({ ":type": "wknd/components/title", text: "Featured adventures", type: "h2" });
  });

  it("exports a whole page as a tree, like .model.json", () => {
    const page = exportResource(resolver.getResource(`${SITE_ROOT}/jcr:content`)!, registry, context)!;
    expect(page).toMatchObject({ ":type": "wknd/components/page", title: "WKND — Live your adventure", ":itemsOrder": ["root"] });
    const root = (page[":items"] as Record<string, Record<string, unknown>>).root;
    expect(root[":type"]).toBe("wknd/components/container");
    expect(root[":itemsOrder"]).toEqual(["container"]);
    const inner = (root[":items"] as Record<string, Record<string, unknown>>).container;
    expect(inner[":itemsOrder"]).toEqual(["hero", "no-title-teaser", "featured-hero", "intro", "heading"]);
  });

  it("a child whose model fails to adapt is skipped, not exported as null", () => {
    const Strict = defineModel({
      name: "Strict",
      type: class {
        title!: string;
        getTitle() {
          return this.title;
        }
      },
      adaptables: ["resource"],
      resourceType: "shop/components/strict",
      fields: { title: valueMap("string") },
    });
    const Box = defineModel({ name: "Box", type: class {}, adaptables: ["resource"], resourceType: "shop/components/box", container: true, fields: {} });
    const repo = createRepository({
      apps: { shop: { components: { strict: {}, box: {} } } },
      page: {
        "sling:resourceType": "shop/components/box",
        good: { "sling:resourceType": "shop/components/strict", title: "ok" },
        bad: { "sling:resourceType": "shop/components/strict" },
        unknown: { "sling:resourceType": "shop/components/other" },
      },
    });
    const shop = new ModelRegistry([Strict, Box]);
    expect(exportResource(repo.getResource("/page")!, shop, { services: {} })).toEqual({
      ":items": { good: { title: "ok" } },
      ":itemsOrder": ["good"],
    });
  });
});
