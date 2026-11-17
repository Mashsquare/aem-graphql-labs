import { describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exercise from "./aem";
import * as solution from "@/solutions/07-aem-first-query/aem";

const lab = pick(exercise, solution);
const mock = withMockAem();

const BALI = "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp";

describe("Lab 07 · endpoint", () => {
  it("builds the publish GraphQL endpoint URL", () => {
    expect(lab.aemGraphQLUrl()).toBe(`${mock.aem.origins.publish}/content/cq:graphql/wknd-shared/endpoint.json`);
  });
});

describe("Lab 07 · aemGraphQL()", () => {
  it("throws on AEM validation errors even though AEM answers HTTP 200", async () => {
    await expect(lab.aemGraphQL("{ adventureList { items { nope } } }")).rejects.toThrow(/Cannot query field "nope"/);
  });
});

describe("Lab 07 · adventureList", () => {
  it("returns the 16 published English adventures, sorted by title, with images", async () => {
    const cards = await lab.getAdventureCards();
    expect(cards).toHaveLength(16);
    expect(cards[0].title).toBe("Bali Surf Camp");
    expect(cards.map((card) => card.title)).not.toContain("Iceland Northern Lights Trek"); // a draft, Author only
    expect(cards.every((card) => card.primaryImage?._dynamicUrl?.startsWith("/adobe/dynamicmedia/deliver/"))).toBe(true);
  });
});

describe("Lab 07 · adventureByPath", () => {
  it("loads one adventure with its location fragment reference", async () => {
    const detail = await lab.getAdventureByPath(BALI);
    expect(detail).toMatchObject({ title: "Bali Surf Camp", difficulty: "Beginner", location: { country: "Indonesia" } });
    expect(detail?.description?.plaintext).toContain("Uluwatu");
  });

  it("returns null for unknown or unpublished paths", async () => {
    expect(await lab.getAdventureByPath("/content/dam/wknd-shared/en/adventures/nope/nope")).toBeNull();
    expect(await lab.getAdventureByPath("/content/dam/wknd-shared/en/adventures/iceland-northern-lights-trek/iceland-northern-lights-trek")).toBeNull();
  });
});

describe("Lab 07 · toPublishUrl()", () => {
  it("prefixes the publish origin", () => {
    expect(lab.toPublishUrl("/adobe/dynamicmedia/deliver/dm-aid--x/a.jpg?preferwebp=true")).toBe(
      `${mock.aem.origins.publish}/adobe/dynamicmedia/deliver/dm-aid--x/a.jpg?preferwebp=true`,
    );
  });
});
