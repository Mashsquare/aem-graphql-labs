import { afterEach, describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseRoute from "./draft-route";
import * as exerciseTier from "./aem-tier";
import * as solutionRoute from "@/solutions/14-aem-author-preview/draft-route";
import * as solutionTier from "@/solutions/14-aem-author-preview/aem-tier";

const { getAemTarget, getAdventures, getAdventureBySlug } = pick(exerciseTier, solutionTier);
const { GET } = pick(exerciseRoute, solutionRoute);

const mock = withMockAem();
const TAHOE = "/content/dam/wknd-shared/en/adventures/tahoe-skiing/tahoe-skiing";

describe("Lab 14 · getAemTarget()", () => {
  afterEach(() => {
    delete process.env.AEM_AUTHOR_TOKEN;
  });

  it("uses anonymous Publish outside preview", () => {
    expect(getAemTarget(false)).toEqual({ tier: "publish", host: mock.aem.origins.publish, headers: {} });
  });

  it("uses Basic auth on Author by default", () => {
    expect(getAemTarget(true)).toEqual({ tier: "author", host: mock.aem.origins.author, headers: { Authorization: "Basic YWRtaW46YWRtaW4=" } });
  });

  it("prefers a Bearer token when AEM_AUTHOR_TOKEN is set", () => {
    process.env.AEM_AUTHOR_TOKEN = "mock-local-dev-token";
    expect(getAemTarget(true).headers.Authorization).toBe("Bearer mock-local-dev-token");
  });
});

describe("Lab 14 · Author vs Publish content", () => {
  it("shows drafts only on Author", async () => {
    const [author, publish] = await Promise.all([getAdventures(true), getAdventures(false)]);
    expect(author).toHaveLength(18);
    expect(publish).toHaveLength(16);
    expect(author.map((adventure) => adventure.slug)).toContain("iceland-northern-lights-trek");
    expect(publish.map((adventure) => adventure.slug)).not.toContain("iceland-northern-lights-trek");
  });

  it("shows unpublished edits only in preview", async () => {
    mock.aem.store.updateFragment(TAHOE, { title: "Tahoe Skiing (edited)" }, "test");
    expect((await getAdventureBySlug("tahoe-skiing", true))?.title).toBe("Tahoe Skiing (edited)");
    expect((await getAdventureBySlug("tahoe-skiing", false))?.title).toBe("Tahoe Skiing");
  });
});

describe("Lab 14 · draft route guards", () => {
  const call = (query: string) => GET(new Request(`http://localhost:3000/api/lab14/draft?${query}`));

  it("rejects a wrong secret with 401", async () => {
    expect((await call("secret=nope&slug=bali-surf-camp")).status).toBe(401);
  });

  it("requires a slug (400)", async () => {
    expect((await call("secret=lab-preview-secret")).status).toBe(400);
  });

  it("returns 404 for a slug that does not exist on Author", async () => {
    expect((await call("secret=lab-preview-secret&slug=does-not-exist")).status).toBe(404);
  });
});
