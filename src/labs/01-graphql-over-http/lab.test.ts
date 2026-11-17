import { parse, type OperationDefinitionNode } from "graphql";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pick } from "@/test/lab";
import * as exercise from "./api";
import * as solution from "@/solutions/01-graphql-over-http/api";

const lab = pick(exercise, solution);

describe("Lab 01 · graphqlRequest()", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs a JSON body with query and variables", async () => {
    const fetchMock = vi.fn(async () => Response.json({ data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await lab.graphqlRequest<{ ok: boolean }>("query Q { ok }", { a: 1 });

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(lab.COUNTRIES_API);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toContain("application/json");
    expect(JSON.parse(String(init.body))).toMatchObject({ query: "query Q { ok }", variables: { a: 1 } });
  });

  it("throws with all GraphQL error messages, even on HTTP 200", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ errors: [{ message: "first" }, { message: "second" }] }));
    await expect(lab.graphqlRequest("{ x }")).rejects.toThrow("first; second");
  });

  it("throws on non-2xx responses and mentions the status", async () => {
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 503 }));
    await expect(lab.graphqlRequest("{ x }")).rejects.toThrow(/503/);
  });
});

describe("Lab 01 · documents", () => {
  it("CONTINENTS_QUERY is a named query", () => {
    const operation = parse(lab.CONTINENTS_QUERY).definitions[0] as OperationDefinitionNode;
    expect(operation.operation).toBe("query");
    expect(operation.name?.value).toBe("Continents");
  });

  it("COUNTRY_QUERY declares $code: ID!", () => {
    const operation = parse(lab.COUNTRY_QUERY).definitions[0] as OperationDefinitionNode;
    const variable = operation.variableDefinitions?.[0];
    expect(variable?.variable.name.value).toBe("code");
    expect(variable?.type.kind).toBe("NonNullType");
  });
});

describe("Lab 01 · against the real Countries API", () => {
  it("returns 7 continents with their countries", async () => {
    const continents = await lab.getContinents();
    expect(continents).toHaveLength(7);
    expect(continents.find((continent) => continent.code === "EU")?.countries.length).toBeGreaterThan(40);
  });

  it("loads Brazil through a variable", async () => {
    const country = await lab.getCountry("BR");
    expect(country).toMatchObject({ name: "Brazil", capital: "Brasília", continent: { name: "South America" } });
    expect(country?.languages[0]?.name).toBe("Portuguese");
  });

  it("returns null for an unknown code", async () => {
    expect(await lab.getCountry("XX")).toBeNull();
  });
});
