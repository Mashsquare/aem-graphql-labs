import { gql } from "graphql-request";
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { pick } from "@/test/lab";
import * as exercise from "./api";
import * as solution from "@/solutions/05-tanstack-query/api";

const api = pick(exercise, solution);

describe("Lab 05 · query keys and paging", () => {
  it("builds hierarchical keys", () => {
    expect(api.characterKeys.list({ status: "dead" })).toEqual(["rick-and-morty", "characters", "list", { status: "dead" }]);
    expect(api.characterKeys.list({}).slice(0, 2)).toEqual([...api.characterKeys.all]);
  });

  it("returns the next page or undefined", () => {
    const page = (next: number | null) => ({ info: { count: 1, pages: 1, next }, results: [] });
    expect(api.getNextPageParam(page(3))).toBe(3);
    expect(api.getNextPageParam(page(null))).toBeUndefined();
  });
});

describe("Lab 05 · graphql-request against the real API", () => {
  it("fetches a filtered page", async () => {
    const page = await api.fetchCharactersPage(1, { status: "dead" });
    expect(page.results).toHaveLength(20);
    expect(page.results.every((character) => character.status === "Dead")).toBe(true);
    expect(page.info.next).toBe(2);
  });

  it("turns a ClientError into readable messages", async () => {
    const error = await api.rickAndMorty.request(gql`{ nope }`).catch((caught: unknown) => caught);
    expect(api.describeError(error)).toMatch(/Cannot query field "nope"/);
  });

  it("works with an infinite query: two pages, then the observer knows there is more", async () => {
    const queryClient = new QueryClient();
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: api.characterKeys.list({ status: "alive" }),
      queryFn: ({ pageParam }) => api.fetchCharactersPage(pageParam as number, { status: "alive" }),
      initialPageParam: 1,
      getNextPageParam: api.getNextPageParam,
    });
    const first = await observer.refetch();
    expect(first.data?.pages).toHaveLength(1);
    const second = await observer.fetchNextPage();
    expect(second.data?.pages).toHaveLength(2);
    expect(second.hasNextPage).toBe(true);
    queryClient.clear();
  });
});
