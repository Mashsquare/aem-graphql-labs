import { describe, expect, it } from "vitest";
import { createFixtureResolver, createRepository, SITE_ROOT, CONTAINER, type JcrJson, type ValueType } from "@/lib/sling";
import { pick } from "@/test/lab";
import * as exerciseCoerce from "./coerce";
import * as exerciseInherit from "./inherit";
import * as exercisePaths from "./paths";
import * as exerciseSupertype from "./supertype";
import * as solutionCoerce from "@/solutions/20-sling-resources-valuemap/coerce";
import * as solutionInherit from "@/solutions/20-sling-resources-valuemap/inherit";
import * as solutionPaths from "@/solutions/20-sling-resources-valuemap/paths";
import * as solutionSupertype from "@/solutions/20-sling-resources-valuemap/supertype";

const { coerce } = pick(exerciseCoerce, solutionCoerce);
const { getParentPath, normalizePath, resolvePath } = pick(exercisePaths, solutionPaths);
const { isResourceType, superTypeOf, typeChain } = pick(exerciseSupertype, solutionSupertype);
const { inheritedProperty } = pick(exerciseInherit, solutionInherit);

const resolver = createFixtureResolver();
const at = (path: string) => {
  const resource = resolver.getResource(path);
  if (!resource) throw new Error(`fixture is missing ${path}`);
  return resource;
};

describe("Lab 20 · Task 1 · coerce", () => {
  const cases: [string, unknown, ValueType, unknown][] = [
    ["numeric string -> long", "1450", "long", 1450],
    ["signed numeric string -> long", "-3", "long", -3],
    ["decimal string is not a long", "12.5", "long", null],
    ["no trimming for long", " 7", "long", null],
    ["number -> long truncates", 12.9, "long", 12],
    ["negative number -> long truncates toward zero", -3.9, "long", -3],
    ["boolean is not a long", true, "long", null],
    ["numeric string -> double", "99.5", "double", 99.5],
    ["double allows surrounding spaces", " 3.5 ", "double", 3.5],
    ["empty string is not a double", "", "double", null],
    ["garbage -> double", "abc", "double", null],
    ["NaN -> double", Number.NaN, "double", null],
    ["'true' -> boolean", "true", "boolean", true],
    ["'TRUE' -> boolean", "TRUE", "boolean", true],
    ["'yes' is false, not null", "yes", "boolean", false],
    ["'1' is false, not null", "1", "boolean", false],
    ["number -> boolean is null", 1, "boolean", null],
    ["boolean passes through", false, "boolean", false],
    ["number -> string", 42, "string", "42"],
    ["boolean -> string", true, "string", "true"],
    ["multi-value -> scalar takes the first", ["a", "b"], "string", "a"],
    ["empty multi-value -> scalar is null", [], "string", null],
    ["multi-value -> long takes the first", ["7", "8"], "long", 7],
    ["scalar -> array wraps", "a", "string[]", ["a"]],
    ["numbers -> string[]", [1, 2], "string[]", ["1", "2"]],
    ["strings -> long[]", ["1", "2"], "long[]", [1, 2]],
    ["one bad element fails long[]", ["1", "x"], "long[]", null],
    ["empty array stays empty", [], "string[]", []],
    ["missing", undefined, "string", null],
    ["null", null, "long", null],
  ];
  it.each(cases)("%s", (_label, value, type, expected) => {
    expect(coerce(value, type)).toEqual(expected);
  });

  it("parses ISO dates and epoch millis", () => {
    expect(coerce("2026-09-02T09:30:00.000Z", "date")).toEqual(new Date("2026-09-02T09:30:00.000Z"));
    expect(coerce(0, "date")).toEqual(new Date(0));
    expect(coerce("garbage", "date")).toBeNull();
    expect(coerce(true, "date")).toBeNull();
  });

  it("matches what the repository's ValueMap returns for the same values", () => {
    const valueMap = at(`${CONTAINER}/price-early`).getValueMap();
    for (const name of ["amount", "currency", "sale", "label", "missing"]) {
      for (const type of ["string", "long", "double", "boolean"] as const) {
        expect(coerce(valueMap.raw(name), type)).toEqual(valueMap.get(name, type));
      }
    }
  });
});

describe("Lab 20 · Task 2 · paths", () => {
  it.each([
    ["/content/wknd/us/en", "/content/wknd/us/en"],
    ["/content//wknd/./us/../us/en/", "/content/wknd/us/en"],
    ["/content/wknd/us/en/jcr:content/root", "/content/wknd/us/en/jcr:content/root"],
    ["/", "/"],
    ["//", "/"],
    ["/a/..", "/"],
  ])("normalizePath(%j) = %j", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });

  it.each(["content/wknd", "", "/..", "/a/../..", "./a"])("normalizePath(%j) = null", (input) => {
    expect(normalizePath(input)).toBeNull();
  });

  it("getParentPath", () => {
    expect(getParentPath("/content/wknd")).toBe("/content");
    expect(getParentPath("/content")).toBe("/");
    expect(getParentPath("/")).toBeNull();
    expect(getParentPath("/content/wknd/")).toBe("/content");
    expect(getParentPath("nope")).toBeNull();
  });

  it("resolvePath", () => {
    expect(resolvePath("/content/wknd", "us/../fr")).toBe("/content/wknd/fr");
    expect(resolvePath("/content/wknd", "/apps/x")).toBe("/apps/x");
    expect(resolvePath("/content", "../../..")).toBeNull();
    expect(resolvePath("/content/wknd", ".")).toBe("/content/wknd");
  });
});

describe("Lab 20 · Task 3 · super types", () => {
  it("superTypeOf reads the component node, /apps before /libs", () => {
    expect(superTypeOf(resolver, "wknd/components/teaser")).toBe("core/wcm/components/teaser/v2/teaser");
    expect(superTypeOf(resolver, "wknd/components/featured-teaser")).toBe("wknd/components/teaser");
  });

  it("superTypeOf accepts the absolute spelling and returns relative types", () => {
    expect(superTypeOf(resolver, "/apps/wknd/components/teaser")).toBe("core/wcm/components/teaser/v2/teaser");
    expect(superTypeOf(resolver, "/apps/wknd/components/featured-teaser")).toBe("wknd/components/teaser");
  });

  it("superTypeOf is null at the top of a chain and for unknown components", () => {
    expect(superTypeOf(resolver, "core/wcm/components/teaser/v2/teaser")).toBeNull();
    expect(superTypeOf(resolver, "wknd/components/pricetag")).toBeNull();
    expect(superTypeOf(resolver, "wknd/components/does-not-exist")).toBeNull();
  });

  it("the component found first in the search path decides, even if it declares nothing", () => {
    const repo = createRepository({
      apps: { shop: { components: { card: {} } } },
      libs: { shop: { components: { card: { "sling:resourceSuperType": "base/card" } } } },
    });
    expect(superTypeOf(repo, "shop/components/card")).toBeNull();
  });

  it("typeChain walks the whole chain, nearest first", () => {
    expect(typeChain(resolver, at(`${CONTAINER}/featured-hero`))).toEqual([
      "wknd/components/featured-teaser",
      "wknd/components/teaser",
      "core/wcm/components/teaser/v2/teaser",
    ]);
    expect(typeChain(resolver, at(`${CONTAINER}/price-early`))).toEqual(["wknd/components/pricetag"]);
  });

  it("typeChain survives a cycle", () => {
    expect(typeChain(resolver, at(`${CONTAINER}/loop`))).toEqual(["wknd/components/loop-a", "wknd/components/loop-b"]);
  });

  it("a resource's own sling:resourceSuperType overrides the component's for the first hop", () => {
    const tree: JcrJson = {
      apps: { shop: { components: { card: { "sling:resourceSuperType": "base/card" }, promo: {} } }, base: { card: {} } },
      content: { one: { "sling:resourceType": "shop/components/card", "sling:resourceSuperType": "shop/components/promo" } },
    };
    const repo = createRepository(tree);
    expect(typeChain(repo, repo.getResource("/content/one")!)).toEqual(["shop/components/card", "shop/components/promo"]);
  });

  it("isResourceType accepts both spellings and rejects unrelated types", () => {
    const featured = at(`${CONTAINER}/featured-hero`);
    expect(isResourceType(resolver, featured, "wknd/components/featured-teaser")).toBe(true);
    expect(isResourceType(resolver, featured, "wknd/components/teaser")).toBe(true);
    expect(isResourceType(resolver, featured, "/apps/wknd/components/teaser")).toBe(true);
    expect(isResourceType(resolver, featured, "/libs/core/wcm/components/teaser/v2/teaser")).toBe(true);
    expect(isResourceType(resolver, featured, "wknd/components/title")).toBe(false);
    expect(isResourceType(resolver, at(`${CONTAINER}/hero`), "wknd/components/featured-teaser")).toBe(false);
  });

  it("agrees with the repository's own Resource.isResourceType", () => {
    for (const name of ["hero", "featured-hero", "heading", "price-early"]) {
      const resource = at(`${CONTAINER}/${name}`);
      for (const type of ["wknd/components/teaser", "core/wcm/components/title/v3/title", "wknd/components/pricetag"]) {
        expect(isResourceType(resolver, resource, type)).toBe(resource.isResourceType(type));
      }
    }
  });
});

describe("Lab 20 · Task 4 · inheritedProperty", () => {
  it("uses the page's own value first", () => {
    expect(inheritedProperty(at(`${SITE_ROOT}/about`), "footerText", "string")).toEqual({ value: "© WKND — About", from: `${SITE_ROOT}/about` });
  });

  it("walks up to the nearest ancestor that has it", () => {
    expect(inheritedProperty(at(`${SITE_ROOT}/adventures/bali-surf-camp`), "footerText", "string")).toEqual({
      value: "© WKND Adventures",
      from: SITE_ROOT,
    });
  });

  it("converts the value to the requested type", () => {
    expect(inheritedProperty(at(`${SITE_ROOT}/adventures`), "showSearch", "boolean")).toEqual({ value: true, from: SITE_ROOT });
  });

  it("a value that cannot be converted counts as missing, so the search continues upward", () => {
    // 'footerText' is "© WKND Adventures" at the root: not a number, so as a long it is found nowhere.
    expect(inheritedProperty(at(`${SITE_ROOT}/adventures`), "footerText", "long")).toBeNull();
  });

  it("returns null when nobody has it", () => {
    expect(inheritedProperty(at(`${SITE_ROOT}/adventures`), "doesNotExist", "string")).toBeNull();
  });
});
