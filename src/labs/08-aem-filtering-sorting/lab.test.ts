import { print } from "graphql";
import { describe, expect, it } from "vitest";
import { aemQuery } from "@/lib/aem/client";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseFilters from "./filters";
import * as exerciseQueries from "./queries";
import * as solutionFilters from "@/solutions/08-aem-filtering-sorting/filters";
import * as solutionQueries from "@/solutions/08-aem-filtering-sorting/queries";
import type { AdventureSearchCriteria, AdventureSearchData, AdventureSortKey } from "./types";

const { buildAdventureFilter, buildSort } = pick(exerciseFilters, solutionFilters);
const { ADVENTURE_SEARCH_QUERY, aemTypePolicies } = pick(exerciseQueries, solutionQueries);

withMockAem();

const search = async (criteria: Partial<AdventureSearchCriteria>, sort: AdventureSortKey = "title") => {
  const data = await aemQuery<AdventureSearchData>(print(ADVENTURE_SEARCH_QUERY), {
    filter: buildAdventureFilter({ activities: [], ...criteria }),
    sort: buildSort(sort),
  });
  return data.adventureList.items.map((item) => item.title);
};

describe("Lab 08 · buildAdventureFilter()", () => {
  it("returns an empty filter for empty criteria", () => {
    expect(buildAdventureFilter({ activities: [] })).toEqual({});
  });

  it("maps every criterion to AEM's filter grammar", () => {
    expect(
      buildAdventureFilter({
        search: "camp",
        activities: ["Surfing", "Skiing"],
        difficulty: "Beginner",
        maxPrice: 2000,
        minGroupSize: 6,
        country: "France",
        departureAfter: "2027-01-01",
      }),
    ).toEqual({
      title: { _expressions: [{ value: "camp", _operator: "CONTAINS", _ignoreCase: true }] },
      activity: { _logOp: "OR", _expressions: [{ value: "Surfing" }, { value: "Skiing" }] },
      difficulty: { _expressions: [{ value: "Beginner" }] },
      price: { _expressions: [{ value: 2000, _operator: "LOWER_EQUAL" }] },
      groupSize: { _expressions: [{ value: 6, _operator: "GREATER_EQUAL" }] },
      location: { country: { _expressions: [{ value: "France" }] } },
      departureDate: { _expressions: [{ value: "2027-01-01", _operator: "AT_OR_AFTER" }] },
    });
  });
});

describe("Lab 08 · buildSort()", () => {
  it("builds AEM sort strings", () => {
    expect(buildSort("title")).toBe("title ASC");
    expect(buildSort("price-asc")).toBe("price ASC, title ASC");
    expect(buildSort("price-desc")).toBe("price DESC, title ASC");
    expect(buildSort("departure")).toBe("departureDate ASC");
  });
});

describe("Lab 08 · ADVENTURE_SEARCH_QUERY against the mock AEM", () => {
  it("ORs activities and ANDs the price", async () => {
    expect(await search({ activities: ["Skiing"], maxPrice: 3000 }, "price-asc")).toEqual(["Tahoe Skiing", "Downhill Skiing Wyoming"]);
  });

  it("matches title fragments case-insensitively", async () => {
    expect(await search({ search: "CAMP" })).toEqual(["Bali Surf Camp", "Riverside Camping in Australia", "Surf Camp in Costa Rica"]);
  });

  it("filters through the location fragment reference", async () => {
    expect(await search({ country: "France" })).toEqual(["Gastronomic Marais Tour", "Ski Touring Mont Blanc"]);
  });

  it("filters by date and sorts by departure", async () => {
    const titles = await search({ departureAfter: "2027-06-01", activities: ["Cycling", "Hiking"] }, "departure");
    expect(titles).toEqual(["West Coast Cycling", "Yosemite Backpacking", "Whistler Mountain Biking"]);
  });

  it("selects _path on adventures and locations (needed for Apollo keyFields)", async () => {
    const data = await aemQuery<AdventureSearchData>(print(ADVENTURE_SEARCH_QUERY), { filter: { slug: { _expressions: [{ value: "bali-surf-camp" }] } } });
    expect(data.adventureList.items[0]).toMatchObject({ _path: expect.any(String), location: { _path: expect.any(String) } });
  });
});

describe("Lab 08 · aemTypePolicies", () => {
  it("identifies AEM fragments by _path", () => {
    expect(aemTypePolicies.AdventureModel?.keyFields).toEqual(["_path"]);
    expect(aemTypePolicies.LocationModel?.keyFields).toEqual(["_path"]);
  });
});
