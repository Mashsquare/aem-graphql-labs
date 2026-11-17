import { describe, expect, it } from "vitest";
import {
  adaptTo as referenceAdaptTo,
  child,
  CONTAINER,
  createFixtureResolver,
  createRepository,
  defineModel,
  fixtureServices,
  osgiService,
  requestAttribute,
  scriptVariable,
  self,
  SITE_ROOT,
  valueMap,
  type Adaptable,
  type InjectionContext,
  type ModelContext,
  type SlingRequest,
} from "@/lib/sling";
import { pick } from "@/test/lab";
import * as exerciseAdapt from "./adapt";
import * as exerciseInjectors from "./injectors";
import { HeroModel, LenientCard, StrictCard } from "./examples";
import * as solutionAdapt from "@/solutions/21-sling-model-adaptto/adapt";
import * as solutionInjectors from "@/solutions/21-sling-model-adaptto/injectors";

const { adaptTo } = pick(exerciseAdapt, solutionAdapt);
const { baseResource, injectChild, injectRequestAttribute, injectScriptVariable, injectSelf, injectService, injectValueMap } = pick(exerciseInjectors, solutionInjectors);

const resolver = createFixtureResolver();
const at = (path: string) => resolver.getResource(path)!;
const hero = at(`${CONTAINER}/hero`);
const services = fixtureServices;
const context: ModelContext = { services };

/** A fully authored card: every property StrictCard needs, the way a dialog would store it ("true" as text on purpose). */
const authoredCard = createRepository({ card: { "jcr:title": "Hello", "jcr:description": "World", sale: "true" } }).getResource("/card")!;

const request = (resource = hero, bindings: Record<string, unknown> = {}, attributes: Record<string, unknown> = {}): SlingRequest => ({ kind: "request", resource, bindings, attributes });

/** An InjectionContext for testing one injector in isolation (nested adaptation uses the lib's reference engine). */
const ctxFor = (adaptable: Adaptable): InjectionContext => ({
  adaptable,
  resource: "kind" in adaptable ? adaptable.resource : adaptable,
  context,
  adapt: (next, model) => referenceAdaptTo(next, model, context),
});

class Pair {
  text!: string;
  link!: string;
}
const PairModel = defineModel({ name: "Pair", type: Pair, adaptables: ["resource"], fields: { text: valueMap("string"), link: valueMap("string") } });

describe("Lab 21 · Task 1 · @ValueMapValue", () => {
  it("baseResource is the resource itself, or its `via` child", () => {
    expect(baseResource({}, ctxFor(hero))?.getPath()).toBe(hero.getPath());
    expect(baseResource({ via: "image" }, ctxFor(hero))?.getPath()).toBe(`${hero.getPath()}/image`);
    expect(baseResource({ via: "nope" }, ctxFor(hero))).toBeNull();
  });

  it("reads the property named like the field, converted to the spec type", () => {
    expect(injectValueMap({ source: "valueMap", type: "string" }, "titleType", ctxFor(hero))).toEqual({ found: true, value: "h1" });
    expect(injectValueMap({ source: "valueMap", type: "boolean" }, "actionsEnabled", ctxFor(hero))).toEqual({ found: true, value: true });
    const price = at(`${CONTAINER}/price-early`);
    expect(injectValueMap({ source: "valueMap", type: "double" }, "amount", ctxFor(price))).toEqual({ found: true, value: 1450 });
  });

  it("@Named wins over the field name", () => {
    expect(injectValueMap({ source: "valueMap", type: "string", named: "jcr:title" }, "title", ctxFor(hero))).toEqual({ found: true, value: "Live your adventure" });
  });

  it("missing and unconvertible are both 'not found'", () => {
    expect(injectValueMap({ source: "valueMap", type: "string" }, "nope", ctxFor(hero))).toEqual({ found: false });
    expect(injectValueMap({ source: "valueMap", type: "double" }, "amount", ctxFor(at(`${CONTAINER}/price-broken`)))).toEqual({ found: false });
  });

  it("@Via reads from a child; a missing via child is 'not found'", () => {
    expect(injectValueMap({ source: "valueMap", type: "string", via: "image", named: "alt" }, "x", ctxFor(hero))).toEqual({ found: true, value: "Surfer on a wave in Bali" });
    expect(injectValueMap({ source: "valueMap", type: "string", via: "nope" }, "alt", ctxFor(hero))).toEqual({ found: false });
  });

  it("a page's content is reached with via: 'jcr:content'", () => {
    const page = at(`${SITE_ROOT}/about`);
    expect(injectValueMap({ source: "valueMap", type: "string", via: "jcr:content", named: "jcr:title" }, "title", ctxFor(page))).toEqual({ found: true, value: "About us" });
  });

  it("adapting from a request reads the request's resource", () => {
    expect(injectValueMap({ source: "valueMap", type: "string" }, "titleType", ctxFor(request()))).toEqual({ found: true, value: "h1" });
  });
});

describe("Lab 21 · Task 2 · @ChildResource", () => {
  it("injects the child resource by default", () => {
    const result = injectChild({ source: "child" }, "image", ctxFor(hero));
    expect(result.found && (result.value as { getPath(): string }).getPath()).toBe(`${hero.getPath()}/image`);
  });

  it("as 'resources' injects the CHILDREN of the named child", () => {
    const result = injectChild({ source: "child", as: "resources" }, "actions", ctxFor(hero));
    expect(result.found && (result.value as { getName(): string }[]).map((r) => r.getName())).toEqual(["item0", "item1"]);
  });

  it("as 'model' adapts the child; as 'models' adapts each grandchild", () => {
    const one = injectChild({ source: "child", model: PairModel as never, named: "actions" }, "x", ctxFor(hero));
    expect(one).toEqual({ found: false }); // 'actions' itself has no text/link, so it does not adapt
    const list = injectChild({ source: "child", as: "models", model: PairModel as never }, "actions", ctxFor(hero));
    expect(list.found && list.value).toEqual([
      expect.objectContaining({ text: "Browse adventures", link: "/content/wknd/us/en/adventures.html" }),
      expect.objectContaining({ text: "Surf forecast", link: "https://www.surf-forecast.com" }),
    ]);
  });

  it("models that do not adapt are left out of lists", () => {
    // `image` has no text/link: its children (none) adapt to nothing; the hero's own children mix both
    const result = injectChild({ source: "child", as: "models", model: PairModel as never }, "container", ctxFor(at(`${SITE_ROOT}/jcr:content/root`)));
    expect(result.found && result.value).toEqual([]);
  });

  it("@Named and @Via work like they do for values", () => {
    const named = injectChild({ source: "child", named: "image" }, "picture", ctxFor(hero));
    expect(named.found).toBe(true);
    const via = injectChild({ source: "child", via: "image" }, "x", ctxFor(hero));
    expect(via).toEqual({ found: false });
  });

  it("no such child -> not found", () => {
    expect(injectChild({ source: "child" }, "nope", ctxFor(hero))).toEqual({ found: false });
    expect(injectChild({ source: "child", as: "models", model: PairModel as never }, "nope", ctxFor(hero))).toEqual({ found: false });
  });
});

describe("Lab 21 · Task 3 · @Self, @OSGiService, @ScriptVariable, @RequestAttribute", () => {
  it("@Self injects the adaptable itself, or adapts it", () => {
    expect(injectSelf({ source: "self" }, "resource", ctxFor(hero))).toEqual({ found: true, value: hero });
    const req = request();
    expect(injectSelf({ source: "self" }, "request", ctxFor(req))).toEqual({ found: true, value: req });
    const model = injectSelf({ source: "self", model: PairModel as never }, "x", ctxFor(at(`${hero.getPath()}/actions/item0`)));
    expect(model.found && model.value).toEqual(expect.objectContaining({ text: "Browse adventures" }));
    expect(injectSelf({ source: "self", model: PairModel as never }, "x", ctxFor(hero))).toEqual({ found: false });
  });

  it("@OSGiService looks the service up by name", () => {
    expect(injectService({ source: "osgi", service: "externalizer" }, "x", ctxFor(hero))).toEqual({ found: true, value: services.externalizer });
    expect(injectService({ source: "osgi", service: "nope" }, "x", ctxFor(hero))).toEqual({ found: false });
  });

  it("@ScriptVariable needs a request and a binding", () => {
    const page = at(`${SITE_ROOT}/about`);
    const req = request(hero, { currentPage: page });
    expect(injectScriptVariable({ source: "script" }, "currentPage", ctxFor(req))).toEqual({ found: true, value: page });
    expect(injectScriptVariable({ source: "script", named: "currentPage" }, "page", ctxFor(req))).toEqual({ found: true, value: page });
    expect(injectScriptVariable({ source: "script" }, "currentPage", ctxFor(hero))).toEqual({ found: false });
    expect(injectScriptVariable({ source: "script" }, "missing", ctxFor(req))).toEqual({ found: false });
  });

  it("@RequestAttribute reads request attributes only", () => {
    const req = request(hero, {}, { selector: "xs" });
    expect(injectRequestAttribute({ source: "requestAttribute" }, "selector", ctxFor(req))).toEqual({ found: true, value: "xs" });
    expect(injectRequestAttribute({ source: "requestAttribute" }, "selector", ctxFor(hero))).toEqual({ found: false });
    expect(injectRequestAttribute({ source: "requestAttribute" }, "other", ctxFor(req))).toEqual({ found: false });
  });
});

describe("Lab 21 · Task 4 · adaptTo", () => {
  it("returns an instance with injected fields", () => {
    expect(adaptTo(authoredCard, StrictCard, context)).toMatchObject({ title: "Hello", description: "World", sale: true });
  });

  it("returns null when a required injection finds nothing (the default strategy is REQUIRED)", () => {
    expect(adaptTo(at(`${CONTAINER}/no-title-teaser`), StrictCard, context)).toBeNull(); // no 'sale' property, no title
    expect(adaptTo(hero, StrictCard, context)).toBeNull(); // hero has no 'sale': required
  });

  it("optional strategy: missing fields keep their initial value", () => {
    const card = adaptTo(at(`${CONTAINER}/price-empty`), LenientCard, context)!;
    expect(card.title).toBe("(untitled)"); // @Default
    expect(card.description).toBe(""); // not found, optional: initializer survives
    expect(card.sale).toBe(false);
  });

  it("applies defaults for missing AND unconvertible values, but not when the value is found", () => {
    const Price = defineModel({
      name: "Price",
      type: class {
        amount!: number;
        currency!: string;
      },
      adaptables: ["resource"],
      fields: { amount: valueMap("double", { default: 0 }), currency: valueMap("string", { default: "USD" }) },
    });
    expect(adaptTo(at(`${CONTAINER}/price-broken`), Price, context)).toMatchObject({ amount: 0, currency: "USD" });
    expect(adaptTo(at(`${CONTAINER}/price-early`), Price, context)).toMatchObject({ amount: 1450, currency: "EUR" });
  });

  it("a falsy default (false, 0, '') still counts as a default", () => {
    const Flag = defineModel({
      name: "Flag",
      type: class {
        on!: boolean;
      },
      adaptables: ["resource"],
      fields: { on: valueMap("boolean", { default: false }) },
    });
    expect(adaptTo(at(`${CONTAINER}/price-empty`), Flag, context)).toMatchObject({ on: false });
  });

  it("per-field optional / required override the model's strategy", () => {
    class Mixed {
      title!: string;
      subtitle?: string;
    }
    const lenientButRequiredTitle = defineModel({
      name: "A",
      type: Mixed,
      adaptables: ["resource"],
      defaultInjectionStrategy: "optional",
      fields: { title: valueMap("string", { named: "jcr:title", optional: false }), subtitle: valueMap("string") },
    });
    const strictButOptionalSubtitle = defineModel({
      name: "B",
      type: Mixed,
      adaptables: ["resource"],
      fields: { title: valueMap("string", { named: "jcr:title" }), subtitle: valueMap("string", { optional: true }) },
    });
    const titled = at(`${CONTAINER}/featured-hero`);
    const untitled = at(`${CONTAINER}/no-title-teaser`);
    expect(adaptTo(titled, lenientButRequiredTitle, context)).toMatchObject({ title: "Featured: Bali Surf Camp" });
    expect(adaptTo(untitled, lenientButRequiredTitle, context)).toBeNull();
    expect(adaptTo(titled, strictButOptionalSubtitle, context)).toMatchObject({ title: "Featured: Bali Surf Camp" });
    expect(adaptTo(untitled, strictButOptionalSubtitle, context)).toBeNull();
  });

  it("checks the adaptable kind", () => {
    const RequestOnly = defineModel({
      name: "R",
      type: class {
        currentPage!: unknown;
      },
      adaptables: ["request"],
      fields: { currentPage: scriptVariable() },
    });
    expect(adaptTo(hero, RequestOnly, context)).toBeNull();
    expect(adaptTo(request(hero, { currentPage: "page" }), RequestOnly, context)).toMatchObject({ currentPage: "page" });
  });

  it("a request-adaptable model can read the resource's properties and request attributes together", () => {
    const Both = defineModel({
      name: "Both",
      type: class {
        titleType!: string;
        variant!: string;
        request!: unknown;
      },
      adaptables: ["request"],
      fields: { titleType: valueMap("string"), variant: requestAttribute(), request: self() },
    });
    const req = request(hero, {}, { variant: "compact" });
    expect(adaptTo(req, Both, context)).toMatchObject({ titleType: "h1", variant: "compact", request: req });
    expect(adaptTo(request(hero), Both, context)).toBeNull(); // required attribute missing
  });

  it("runs @PostConstruct after all fields are injected, in order, and survives optional gaps", () => {
    const calls: string[] = [];
    class Computed {
      title!: string;
      shout = "";
      second = "";
      init() {
        calls.push("init");
        this.shout = this.title.toUpperCase();
      }
      after() {
        calls.push("after");
        this.second = `${this.shout}!`;
      }
    }
    const Model = defineModel({
      name: "Computed",
      type: Computed,
      adaptables: ["resource"],
      fields: { title: valueMap("string", { named: "jcr:title" }) },
      postConstruct: ["init", "after"],
    });
    expect(adaptTo(hero, Model, context)).toMatchObject({ shout: "LIVE YOUR ADVENTURE", second: "LIVE YOUR ADVENTURE!" });
    expect(calls).toEqual(["init", "after"]);
  });

  it("a @PostConstruct that throws makes adaptTo return null", () => {
    const Boom = defineModel({
      name: "Boom",
      type: class {
        title!: string;
        init() {
          throw new Error("kaboom");
        }
      },
      adaptables: ["resource"],
      fields: { title: valueMap("string", { named: "jcr:title" }) },
      postConstruct: ["init"],
    });
    expect(adaptTo(hero, Boom, context)).toBeNull();
  });

  it("does not cache: every call creates a new instance", () => {
    expect(adaptTo(authoredCard, StrictCard, context)).not.toBe(adaptTo(authoredCard, StrictCard, context));
  });

  it("does not run @PostConstruct when injection failed", () => {
    let ran = false;
    const Never = defineModel({
      name: "Never",
      type: class {
        missing!: string;
        init() {
          ran = true;
        }
      },
      adaptables: ["resource"],
      fields: { missing: valueMap("string") },
      postConstruct: ["init"],
    });
    expect(adaptTo(hero, Never, context)).toBeNull();
    expect(ran).toBe(false);
  });

  it("nested models: an optional child that fails to adapt is skipped, a required one fails the parent", () => {
    const Outer = (optional: boolean) =>
      defineModel({
        name: "Outer",
        type: class {
          pair?: unknown;
        },
        adaptables: ["resource"],
        fields: { pair: child({ model: PairModel as never, named: "image", optional }) },
      });
    expect(adaptTo(hero, Outer(true), context)).not.toBeNull();
    expect(adaptTo(hero, Outer(false), context)).toBeNull();
  });

  it("builds the full Hero: value, named, child model, child model list, service, postConstruct", () => {
    const model = adaptTo(hero, HeroModel, context)!;
    expect(model).toMatchObject({
      title: "Live your adventure",
      href: "/adventures",
      linkLabel: "Read more about Live your adventure",
    });
    expect(model.image).toMatchObject({ fileReference: expect.stringContaining("bali-surf-camp-hero.jpg"), alt: "Surfer on a wave in Bali" });
    expect(model.actions).toHaveLength(2);
    expect(model.actions[0]).toMatchObject({ text: "Browse adventures" });
  });

  it("Hero without its required title does not adapt, and without services its @PostConstruct fails", () => {
    expect(adaptTo(at(`${CONTAINER}/no-title-teaser`), HeroModel, context)).toBeNull();
    expect(adaptTo(hero, HeroModel, { services: {} })).toBeNull();
  });

  it("uses @OSGiService from the context", () => {
    const WithService = defineModel({
      name: "S",
      type: class {
        tagManager!: typeof services.tagManager;
      },
      adaptables: ["resource"],
      fields: { tagManager: osgiService("tagManager") },
    });
    expect(adaptTo(hero, WithService, context)!.tagManager.title("wknd:activity/surfing")).toBe("Surfing");
    expect(adaptTo(hero, WithService, { services: {} })).toBeNull();
  });
});
