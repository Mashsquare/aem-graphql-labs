import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMockAem, type MockAem } from "../src/http/server";

let aem: MockAem;
const basic = `Basic ${Buffer.from("admin:admin").toString("base64")}`;
const gql = (tier: "author" | "publish", query: string, variables?: Record<string, unknown>, headers: Record<string, string> = {}) =>
  fetch(`${aem.origins[tier]}/content/cq:graphql/wknd-shared/endpoint.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(tier === "author" ? { Authorization: basic } : {}), ...headers },
    body: JSON.stringify({ query, variables }),
  }).then((response) => response.json() as Promise<{ data?: Record<string, never>; errors?: { message: string; extensions: { classification: string } }[] }>);

beforeAll(async () => {
  aem = createMockAem({ authorPort: 0, publishPort: 0, stateFile: null, webhookUrls: [], latencyMs: 0, logRequests: false });
  await aem.start();
});
afterAll(() => aem.stop());

describe("tiers and auth", () => {
  it("requires auth on Author only", async () => {
    expect((await fetch(`${aem.origins.author}/graphql/list.json`)).status).toBe(401);
    expect((await fetch(`${aem.origins.author}/graphql/list.json`, { headers: { Authorization: "Bearer mock-local-dev-token" } })).status).toBe(200);
    expect((await fetch(`${aem.origins.publish}/graphql/list.json`)).status).toBe(200);
  });

  it("hides drafts on Publish", async () => {
    const query = `{ adventureList(_locale: "en") { items { slug } } }`;
    const count = async (tier: "author" | "publish") => ((await gql(tier, query)).data as unknown as { adventureList: { items: unknown[] } }).adventureList.items.length;
    expect(await count("author")).toBe(18);
    expect(await count("publish")).toBe(16);
  });

  it("only sends CORS headers to allowed origins", async () => {
    const preflight = (origin: string) =>
      fetch(`${aem.origins.publish}/content/cq:graphql/wknd-shared/endpoint.json`, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST" } });
    expect((await preflight("http://localhost:3000")).headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect((await preflight("http://evil.example")).headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("GraphQL behaviour", () => {
  it("classifies validation errors and still answers 200", async () => {
    const response = await gql("publish", `{ adventureList(filter: { price: { _expressions: [{ value: 1, _operator: EQUALS }] } }) { items { title } } }`);
    expect(response.errors?.[0].extensions.classification).toBe("ValidationError");
  });

  it("only knows the wknd-shared configuration", async () => {
    const response = await fetch(`${aem.origins.publish}/content/cq:graphql/global/endpoint.json`, { method: "POST", body: "{}" });
    expect(response.status).toBe(404);
  });

  it("serves the schema as SDL", async () => {
    const sdl = await (await fetch(`${aem.origins.publish}/content/cq:graphql/wknd-shared/endpoint.GQLschema`)).text();
    expect(sdl).toContain("type AdventureModel");
    expect(sdl).toContain("adventurePaginated(");
  });
});

describe("persisted queries and replication", () => {
  const persistUrl = () => `${aem.origins.author}/graphql/persist.json/wknd-shared/test-query`;
  const executeUrl = () => `${aem.origins.publish}/graphql/execute.json/wknd-shared/test-query;slug=tahoe-skiing`;
  const body = JSON.stringify({ query: `query($slug: String!) { adventureList(filter: { slug: { _expressions: [{ value: $slug }] } }) { items { title } } }` });

  it("create -> 404 on Publish -> replicate -> 200 with cache headers", async () => {
    expect((await fetch(persistUrl(), { method: "PUT", headers: { Authorization: basic }, body })).status).toBe(201);
    expect((await fetch(persistUrl(), { method: "PUT", headers: { Authorization: basic }, body })).status).toBe(409);
    expect((await fetch(executeUrl())).status).toBe(404);

    const replicate = await fetch(`${aem.origins.author}/bin/replicate.json`, {
      method: "POST",
      headers: { Authorization: basic, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ cmd: "activate", path: "/conf/wknd-shared/settings/graphql/persistentQueries/test-query" }),
    });
    expect(replicate.status).toBe(200);

    const executed = await fetch(executeUrl());
    expect(executed.status).toBe(200);
    expect(executed.headers.get("cache-control")).toBe("max-age=60");
    expect(executed.headers.get("surrogate-control")).toContain("max-age=7200");
    expect(await executed.json()).toEqual({ data: { adventureList: { items: [{ title: "Tahoe Skiing" }] } } });
  });

  it("publishes edits only after replication", async () => {
    const path = "/content/dam/wknd-shared/en/adventures/napa-wine-tasting/napa-wine-tasting";
    aem.store.updateFragment(path, { price: 999 }, "test");
    const price = async (tier: "author" | "publish") =>
      ((await gql(tier, `{ adventureByPath(_path: "${path}") { item { price } } }`)).data as unknown as { adventureByPath: { item: { price: number } } }).adventureByPath.item.price;
    expect(await price("author")).toBe(999);
    expect(await price("publish")).toBe(260);
    aem.store.replicate(path, "activate", "test");
    expect(await price("publish")).toBe(999);
  });
});

describe("classic site: HTL, .model.json and Core Image", () => {
  const publish = (path: string) => fetch(`${aem.origins.publish}${path}`);

  it("serves HTL output with React mount points", async () => {
    const html = await (await publish("/content/wknd/us/en/adventures.html")).text();
    expect(html).toContain('data-react-component="PriceTag"');
    expect(html).toContain('data-amount="1450"');
    expect(html).toMatch(/data-sale data-label=/); // HTL: true -> bare attribute
    expect(html).toContain('type="application/json" id="departure-props-');
    expect(html).not.toContain("data-cq-data-path"); // Publish has no edit mode
  });

  it("adds edit-mode attributes on Author only, unless wcmmode=disabled", async () => {
    const author = (query: string) => fetch(`${aem.origins.author}/content/wknd/us/en/adventures.html${query}`, { headers: { Authorization: basic } }).then((r) => r.text());
    expect(await author("")).toContain("data-cq-data-path");
    expect(await author("?wcmmode=disabled")).not.toContain("data-cq-data-path");
  });

  it("exports the page model with :items and :itemsOrder", async () => {
    const model = (await (await publish("/content/wknd/us/en/featured.model.json")).json()) as Record<string, any>;
    expect(model[":type"]).toBe("wknd/components/page");
    const container = model[":items"].root[":items"].container;
    expect(container[":itemsOrder"]).toEqual(["title", "intro", "cards"]);
    expect(container.columnClassNames.title).toContain("aem-GridColumn");
  });

  it("exports a single component by its jcr:content path", async () => {
    const teaser = (await (await publish("/content/wknd/us/en/jcr:content/root/container/hero.model.json")).json()) as Record<string, any>;
    expect(teaser[":type"]).toBe("wknd/components/teaser");
    expect(teaser.image.srcUriTemplate).toContain("{.width}");
  });

  it("blocks the default JSON renderer and 404s unknown resources", async () => {
    expect((await publish("/content/wknd/us/en.infinity.json")).status).toBe(403);
    expect((await publish("/content/wknd/us/en/nope.model.json")).status).toBe(404);
  });

  it("delivers Core Image renditions by width", async () => {
    const model = (await (await publish("/content/wknd/us/en/jcr:content/root/container/banner.model.json")).json()) as { srcUriTemplate: string };
    const response = await publish(model.srcUriTemplate.replace("{.width}", ".320"));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("320×");
  });
});
