import { Client } from "urql";
import { describe, expect, it } from "vitest";
import { pick } from "@/test/lab";
import * as exercise from "./urql";
import * as solution from "@/solutions/04-urql/urql";

const { createUrqlClient, CONTINENTS_QUERY, COUNTRIES_QUERY } = pick(exercise, solution);

describe("Lab 04 · urql client", () => {
  it("creates a Client", () => {
    expect(createUrqlClient()).toBeInstanceOf(Client);
  });

  it("loads continents and answers the second request from the document cache", async () => {
    const client = createUrqlClient();
    const first = await client.query(CONTINENTS_QUERY, {}).toPromise();
    expect(first.error).toBeUndefined();
    expect(first.data?.continents).toHaveLength(7);
    // urql adds __typename to every selection (its cache needs it for invalidation).
    expect(first.data?.continents[0]).toMatchObject({ code: "AF", name: "Africa", __typename: "Continent" });

    const second = await client.query(CONTINENTS_QUERY, {}).toPromise();
    expect(second.operation.context.meta?.cacheOutcome).toBe("hit");
  });

  it("filters countries by continent through a variable", async () => {
    const client = createUrqlClient();
    const result = await client.query(COUNTRIES_QUERY, { continent: "OC" }).toPromise();
    expect(result.error).toBeUndefined();
    const australia = result.data?.countries.find((country) => country.code === "AU");
    expect(australia).toMatchObject({ name: "Australia", capital: "Canberra", currency: "AUD" });
    expect(result.data?.countries.every((country) => typeof country.emoji === "string")).toBe(true);
  });
});
