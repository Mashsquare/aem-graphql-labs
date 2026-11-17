import { describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseClients from "./aem-headless";
import * as exerciseData from "./data";
import * as exercisePersist from "./persist-queries";
import * as solutionClients from "@/solutions/11-aem-persisted-queries/aem-headless";
import * as solutionData from "@/solutions/11-aem-persisted-queries/data";
import * as solutionPersist from "@/solutions/11-aem-persisted-queries/persist-queries";

const { createPublishClient, createAuthorClient } = pick(exerciseClients, solutionClients);
const { persistedQueryUrl, getAdventuresByDifficulty, inspectPersistedQuery } = pick(exerciseData, solutionData);
const { persistLabQueries } = pick(exercisePersist, solutionPersist);

const mock = withMockAem();

describe("Lab 11 · persistedQueryUrl()", () => {
  it("appends encoded matrix parameters", () => {
    expect(persistedQueryUrl("wknd-shared/adventure-by-slug", { slug: "bali-surf-camp" })).toBe(
      "/graphql/execute.json/wknd-shared/adventure-by-slug;slug=bali-surf-camp",
    );
  });
  it("encodes special characters and JSON-encodes non-strings, skipping empty values", () => {
    expect(persistedQueryUrl("cfg/q", { text: "a;b=c/d", limit: 3, filter: { x: 1 }, skip: undefined })).toBe(
      `/graphql/execute.json/cfg/q;text=a%3Bb%3Dc%2Fd;limit=3;filter=${encodeURIComponent('{"x":1}')}`,
    );
  });
});

describe("Lab 11 · SDK clients", () => {
  it("point at the right tiers and endpoint", () => {
    const publish = createPublishClient();
    const author = createAuthorClient();
    expect(publish.serviceURL).toBe(`${mock.aem.origins.publish}/`);
    expect(author.serviceURL).toBe(`${mock.aem.origins.author}/`);
    expect(publish.endpoint).toBe("content/cq:graphql/wknd-shared/endpoint.json");
  });

  it("the publish client can run a seeded persisted query", async () => {
    const result = await createPublishClient().runPersistedQuery<{ adventureList: { items: unknown[] } }>("wknd-shared/adventures-all");
    expect(result.data.adventureList.items).toHaveLength(16);
  });
});

describe("Lab 11 · persist -> replicate -> execute", () => {
  it("is not available on Publish before persisting", async () => {
    const inspection = await inspectPersistedQuery("wknd-shared/lab-adventures-by-difficulty", { difficulty: "Expert" });
    expect(inspection.status).toBe(404);
  });

  it("persists both lab queries on Author and publishes them", async () => {
    const paths = await persistLabQueries();
    expect(paths).toEqual(["wknd-shared/lab-adventures-by-difficulty", "wknd-shared/lab-adventure-slugs"]);
    expect(mock.aem.store.persistedQuery("wknd-shared", "lab-adventures-by-difficulty")?.published).toBe(true);
    expect(mock.aem.store.persistedQuery("wknd-shared", "lab-adventures-by-difficulty")?.cacheControl).toEqual({ "max-age": 120 });
  });

  it("can run again (updates instead of failing with 409)", async () => {
    await expect(persistLabQueries()).resolves.toHaveLength(2);
  });

  it("executes on Publish with the configured cache headers", async () => {
    const adventures = await getAdventuresByDifficulty("Expert");
    expect(adventures.map((adventure) => adventure.title)).toEqual(["Ski Touring Mont Blanc"]);

    const inspection = await inspectPersistedQuery("wknd-shared/lab-adventures-by-difficulty", { difficulty: "Beginner" });
    expect(inspection.status).toBe(200);
    expect(inspection.cacheControl).toBe("max-age=120");
    expect(inspection.surrogateControl).toContain("max-age=600");
  });
});
