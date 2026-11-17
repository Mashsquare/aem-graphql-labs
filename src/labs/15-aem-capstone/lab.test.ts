import { parse, print } from "graphql";
import { describe, expect, it } from "vitest";
import { aemConfig } from "@/lib/aem/config";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseData from "./data";
import * as exerciseDocuments from "./documents";
import * as exerciseEvents from "./aem-events";
import * as solutionData from "@/solutions/15-aem-capstone/data";
import * as solutionDocuments from "@/solutions/15-aem-capstone/documents";
import * as solutionEvents from "@/solutions/15-aem-capstone/aem-events";

const { fetchAdventures, fetchAdventure, ADVENTURES_TAG, adventureTag } = pick(exerciseData, solutionData);
const documents = pick(exerciseDocuments, solutionDocuments);
const { tagsForEvent, POST } = pick(exerciseEvents, solutionEvents);

withMockAem();

describe("Lab 15 · contract: typed documents match the persisted queries in AEM", () => {
  it("adventures-all and adventure-by-slug are identical to what Publish has", async () => {
    const list = (await (await fetch(`${aemConfig().publishHost}/graphql/list.json`)).json()) as { path: { shortPath: string }; data: { query: string } }[];
    const persisted = (shortPath: string) => print(parse(list.find((entry) => entry.path.shortPath === `/${shortPath}`)!.data.query));
    expect(print(documents.adventuresAllQuery)).toBe(persisted(documents.PERSISTED_ADVENTURES_ALL));
    expect(print(documents.adventureBySlugQuery)).toBe(persisted(documents.PERSISTED_ADVENTURE_BY_SLUG));
  });
});

describe("Lab 15 · data fetchers (persisted queries)", () => {
  it("fetchAdventures() returns the 16 English adventures", async () => {
    const adventures = await fetchAdventures();
    expect(adventures).toHaveLength(16);
    expect(adventures[0]).toMatchObject({ title: "Bali Surf Camp", slug: "bali-surf-camp" });
  });

  it("fetchAdventure() returns the adventure with location and references", async () => {
    const detail = await fetchAdventure("ski-touring-mont-blanc");
    expect(detail?.adventure).toMatchObject({ title: "Ski Touring Mont Blanc", location: { country: "France" } });
    expect(Array.isArray(detail?.adventure.description?.json)).toBe(true);
    expect(detail?.references.length).toBeGreaterThan(0);
  });

  it("fetchAdventure() returns null for unknown slugs and drafts", async () => {
    expect(await fetchAdventure("does-not-exist")).toBeNull();
    expect(await fetchAdventure("iceland-northern-lights-trek")).toBeNull();
  });
});

describe("Lab 15 · webhook", () => {
  const event = (type: string, data: Record<string, unknown>) => ({ type, data });

  it("maps publish events to cache tags", () => {
    expect(tagsForEvent(event("aem.sites.contentFragment.published", { model: "adventure", slug: "tahoe-skiing" }))).toEqual([
      ADVENTURES_TAG,
      adventureTag("tahoe-skiing"),
    ]);
    expect(tagsForEvent(event("aem.sites.contentFragment.unpublished", { model: "location" }))).toEqual([ADVENTURES_TAG]);
    expect(tagsForEvent(event("aem.graphql.persistedQuery.published", { shortPath: "/wknd-shared/adventures-all" }))).toEqual([ADVENTURES_TAG]);
  });

  it("ignores Author-only changes and unrelated models", () => {
    expect(tagsForEvent(event("aem.sites.contentFragment.modified", { model: "adventure", slug: "tahoe-skiing" }))).toEqual([]);
    expect(tagsForEvent(event("aem.sites.contentFragment.published", { model: "article", slug: "x" }))).toEqual([]);
  });

  it("rejects requests without the shared secret", async () => {
    const response = await POST(new Request("http://localhost/api/aem-events", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/aem-events", { method: "POST", headers: { "x-aem-webhook-secret": "mock-webhook-secret" }, body: "{nope" }),
    );
    expect(response.status).toBe(400);
  });
});
