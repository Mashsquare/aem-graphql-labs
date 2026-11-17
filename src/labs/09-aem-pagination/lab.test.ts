import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { aemConfig } from "@/lib/aem/config";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseCursor from "./cursor";
import * as exerciseOffset from "./offset";
import * as solutionCursor from "@/solutions/09-aem-pagination/cursor";
import * as solutionOffset from "@/solutions/09-aem-pagination/offset";

const { getAdventurePage } = pick(exerciseOffset, solutionOffset);
const { ADVENTURES_CONNECTION_QUERY, paginationTypePolicies, fetchAllAdventureTitles } = pick(exerciseCursor, solutionCursor);

withMockAem();

describe("Lab 09 · offset paging", () => {
  it("returns the first page and detects a next page with limit + 1", async () => {
    const page = await getAdventurePage(1, 5);
    expect(page.items).toHaveLength(5);
    expect(page.items[0].title).toBe("Bali Surf Camp");
    expect(page.hasNextPage).toBe(true);
  });

  it("knows when the last page is reached (16 adventures = 3 full pages + 1)", async () => {
    const last = await getAdventurePage(4, 5);
    expect(last.items.map((item) => item.title)).toEqual(["Yosemite Backpacking"]);
    expect(last.hasNextPage).toBe(false);
    expect((await getAdventurePage(3, 5)).hasNextPage).toBe(true);
  });
});

describe("Lab 09 · cursor paging", () => {
  it("walks every page by following endCursor", async () => {
    const titles = await fetchAllAdventureTitles(5);
    expect(titles).toHaveLength(16);
    expect(titles[0]).toBe("Bali Surf Camp");
    expect(titles.at(-1)).toBe("Yosemite Backpacking");
    expect(new Set(titles).size).toBe(16);
  });

  it("merges pages into one list in Apollo's cache (relayStylePagination)", async () => {
    const { publishHost, endpoint } = aemConfig();
    const client = new ApolloClient({
      cache: new InMemoryCache({ typePolicies: paginationTypePolicies }),
      link: new HttpLink({ uri: `${publishHost}${endpoint}` }),
    });
    const first = await client.query({ query: ADVENTURES_CONNECTION_QUERY, variables: { first: 5 } });
    const endCursor = first.data?.adventurePaginated.pageInfo.endCursor;
    expect(endCursor).toBeTruthy();
    // This is what fetchMore does: fetch with `after` from the network, then let the field policy merge.
    // (cache-first would be answered by relayStylePagination's read function without a request.)
    await client.query({ query: ADVENTURES_CONNECTION_QUERY, variables: { first: 5, after: endCursor }, fetchPolicy: "network-only" });
    const merged = client.readQuery({ query: ADVENTURES_CONNECTION_QUERY, variables: { first: 5 } });
    expect(merged?.adventurePaginated.edges).toHaveLength(10);
    expect(merged?.adventurePaginated.pageInfo.hasNextPage).toBe(true);
  });
});
