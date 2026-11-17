import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelNode } from "@/lib/aem/page-model";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseCard from "./card";
import * as exerciseFragments from "./fragments";
import * as exercisePage from "./page";
import * as solutionCard from "@/solutions/19-hybrid-page/card";
import * as solutionFragments from "@/solutions/19-hybrid-page/fragments";
import * as solutionPage from "@/solutions/19-hybrid-page/page";
import type { Adventure } from "./types";

const { mergeCardProps } = pick(exerciseCard, solutionCard);
const { collectFragmentPaths, getAdventuresByPath, ADVENTURES_BY_PATH_QUERY } = pick(exerciseFragments, solutionFragments);
const { loadHybridPage } = pick(exercisePage, solutionPage);

const mock = withMockAem();
const BALI = "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp";
const MONT_BLANC = "/content/dam/wknd-shared/en/adventures/ski-touring-mont-blanc/ski-touring-mont-blanc";
const ICELAND = "/content/dam/wknd-shared/en/adventures/iceland-northern-lights-trek/iceland-northern-lights-trek";

afterEach(() => vi.restoreAllMocks());

describe("Lab 19 · Task 1 · collectFragmentPaths", () => {
  const card = (name: string, fragmentPath?: unknown): ModelNode => ({ ":type": "wknd/components/adventurecard", ":path": `/p/${name}`, ...(fragmentPath === undefined ? {} : { fragmentPath }) });

  it("finds cards at any depth, in page order, once each", () => {
    const model: ModelNode = {
      ":type": "page",
      ":items": {
        root: {
          ":type": "container",
          ":items": {
            late: card("late", "/c"),
            nested: { ":type": "container", ":items": { a: card("a", "/a"), again: card("again", "/a") }, ":itemsOrder": ["a", "again"] },
            early: card("early", "/b"),
          },
          ":itemsOrder": ["nested", "early", "late"],
        },
      },
      ":itemsOrder": ["root"],
    };
    expect(collectFragmentPaths(model)).toEqual(["/a", "/b", "/c"]);
  });

  it("ignores empty cards, bad values and other components", () => {
    const model: ModelNode = {
      ":type": "container",
      ":items": {
        empty: card("empty"),
        blank: card("blank", ""),
        number: card("number", 42),
        other: { ":type": "wknd/components/title", fragmentPath: "/not-a-card" },
      },
    };
    expect(collectFragmentPaths(model)).toEqual([]);
  });
});

describe("Lab 19 · Task 2 · getAdventuresByPath", () => {
  it("asks for all fragments in a single query", () => {
    expect(ADVENTURES_BY_PATH_QUERY).toContain("adventureList");
    expect(ADVENTURES_BY_PATH_QUERY).toContain("$filter: AdventureModelFilter!");
  });

  it("returns an entry for every path: the adventure, or null", async () => {
    const result = await getAdventuresByPath([BALI, MONT_BLANC, ICELAND, "/content/dam/typo"]);
    expect([...result.keys()]).toEqual([BALI, MONT_BLANC, ICELAND, "/content/dam/typo"]);
    expect(result.get(BALI)).toMatchObject({ slug: "bali-surf-camp", title: "Bali Surf Camp", price: 1890 });
    expect(result.get(BALI)?.primaryImage?._dynamicUrl).toContain("/adobe/dynamicmedia/deliver/");
    expect(result.get(MONT_BLANC)?.slug).toBe("ski-touring-mont-blanc");
    expect(result.get(ICELAND)).toBeNull(); // a draft: only on Author
    expect(result.get("/content/dam/typo")).toBeNull();
  });

  it("sends exactly one request, and none for an empty list", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await getAdventuresByPath([BALI, MONT_BLANC]);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockClear();
    const empty = await getAdventuresByPath([]);
    expect(empty.size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("Lab 19 · Task 3 · mergeCardProps", () => {
  const fragment: Adventure = {
    _path: BALI,
    title: "Bali Surf Camp",
    slug: "bali-surf-camp",
    activity: "Surfing",
    difficulty: "Beginner",
    price: 1450,
    primaryImage: { _dynamicUrl: "/adobe/dynamicmedia/deliver/dm-aid--1/hero.jpg?preferwebp=true", width: 2000, height: 1333 },
  };

  it("returns null without a fragment", () => {
    expect(mergeCardProps({ fragmentPath: BALI }, null)).toBeNull();
    expect(mergeCardProps({ fragmentPath: BALI }, undefined)).toBeNull();
  });

  it("takes content from the fragment and presentation from the dialog", () => {
    const vm = mergeCardProps({ fragmentPath: BALI, showPrice: true, layout: "full" }, fragment)!;
    expect(vm).toMatchObject({ title: "Bali Surf Camp", href: "/adventures/bali-surf-camp", meta: "Surfing · Beginner", price: 1450, layout: "full" });
    expect(vm.image?.src).toMatch(/^http:\/\/localhost:\d+\/adobe\/dynamicmedia\/deliver\/dm-aid--1\/hero\.jpg\?preferwebp=true&width=960$/);
    expect(vm.image).toMatchObject({ width: 2000, height: 1333 });
  });

  it("hides the price unless showPrice is exactly true (checkbox semantics)", () => {
    expect(mergeCardProps({ showPrice: false }, fragment)?.price).toBeNull();
    expect(mergeCardProps({}, fragment)?.price).toBeNull();
    expect(mergeCardProps({ showPrice: "true" as unknown as boolean }, fragment)?.price).toBeNull();
    expect(mergeCardProps({ showPrice: true }, { ...fragment, price: null })?.price).toBeNull();
    expect(mergeCardProps({ showPrice: true }, { ...fragment, price: 0 })?.price).toBe(0);
  });

  it("falls back to the full layout and requests a smaller image for compact", () => {
    expect(mergeCardProps({ layout: "huge" }, fragment)?.layout).toBe("full");
    const compact = mergeCardProps({ layout: "compact" }, fragment)!;
    expect(compact.layout).toBe("compact");
    expect(compact.image?.src).toContain("width=480");
  });

  it("copes with missing optional fields", () => {
    const vm = mergeCardProps({}, { ...fragment, activity: null, difficulty: "Expert", primaryImage: null })!;
    expect(vm.meta).toBe("Expert");
    expect(vm.image).toBeNull();
    expect(mergeCardProps({}, { ...fragment, activity: null, difficulty: null })?.meta).toBe("");
  });
});

describe("Lab 19 · Task 4 · loadHybridPage", () => {
  it("loads the featured page and the content of its cards with one GraphQL request", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const { model, adventures } = await loadHybridPage("/content/wknd/us/en/featured");
    expect(model.title).toBe("Featured adventures");
    expect([...adventures.keys()]).toEqual([BALI, MONT_BLANC, ICELAND]);
    expect(adventures.get(BALI)?.title).toBe("Bali Surf Camp");
    expect(adventures.get(ICELAND)).toBeNull();

    const urls = spy.mock.calls.map(([input]) => String(input));
    expect(urls.filter((url) => url.includes(".model.json"))).toHaveLength(1);
    expect(urls.filter((url) => url.includes("endpoint.json"))).toHaveLength(1);
    expect(urls.every((url) => url.startsWith(mock.aem.origins.publish))).toBe(true);
  });

  it("rejects for a page that does not exist", async () => {
    await expect(loadHybridPage("/content/wknd/us/en/nope")).rejects.toThrow();
  });
});
