import { ApolloClient, InMemoryCache } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { pick } from "@/test/lab";
import * as exerciseApollo from "./apollo";
import * as exerciseQueries from "./queries";
import * as solutionApollo from "@/solutions/03-apollo-client/apollo";
import * as solutionQueries from "@/solutions/03-apollo-client/queries";
import type { EpisodesData } from "./types";

const { typePolicies, makeClient } = pick(exerciseApollo, solutionApollo);
const { EPISODES_QUERY, EPISODE_QUERY } = pick(exerciseQueries, solutionQueries);

const pageOf = (ids: number[], next: number | null): EpisodesData => ({
  episodes: {
    __typename: "Episodes",
    info: { count: 51, pages: 3, next, prev: null },
    results: ids.map((id) => ({ __typename: "Episode", id: String(id), name: `Episode ${id}`, episode: `S01E0${id}`, air_date: "December 2, 2013" })),
  },
});

describe("Lab 03 · typePolicies for Query.episodes", () => {
  const write = (cache: InMemoryCache, page: number, name: string, data: EpisodesData) =>
    cache.writeQuery({ query: EPISODES_QUERY, variables: { page, filter: { name } }, data });
  const read = (cache: InMemoryCache, name: string) =>
    cache.readQuery({ query: EPISODES_QUERY, variables: { page: 1, filter: { name } } })?.episodes?.results.map((episode) => episode.id);

  it("appends page 2 to page 1 for the same filter", () => {
    const cache = new InMemoryCache({ typePolicies });
    write(cache, 1, "", pageOf([1, 2], 2));
    write(cache, 2, "", pageOf([3, 4], null));
    expect(read(cache, "")).toEqual(["1", "2", "3", "4"]);
  });

  it("keeps different filters in different lists", () => {
    const cache = new InMemoryCache({ typePolicies });
    write(cache, 1, "", pageOf([1, 2], 2));
    write(cache, 1, "pickle", pageOf([24], null));
    expect(read(cache, "")).toEqual(["1", "2"]);
    expect(read(cache, "pickle")).toEqual(["24"]);
  });

  it("starts over when page 1 is fetched again (refetch)", () => {
    const cache = new InMemoryCache({ typePolicies });
    write(cache, 1, "", pageOf([1, 2], 2));
    write(cache, 2, "", pageOf([3, 4], null));
    write(cache, 1, "", pageOf([1, 2], 2));
    expect(read(cache, "")).toEqual(["1", "2"]);
  });

  it("normalizes episodes by id (Episode:1 is stored once)", () => {
    const cache = new InMemoryCache({ typePolicies });
    write(cache, 1, "", pageOf([1, 2], 2));
    expect(Object.keys(cache.extract())).toEqual(expect.arrayContaining(["Episode:1", "Episode:2", "ROOT_QUERY"]));
  });
});

describe("Lab 03 · makeClient() against the real API", () => {
  it("creates an ApolloClient that can load episodes and an episode", async () => {
    const client = makeClient();
    expect(client).toBeInstanceOf(ApolloClient);
    const { data } = await client.query({ query: EPISODES_QUERY, variables: { page: 1 } });
    expect(data?.episodes?.results).toHaveLength(20);
    const { data: detail } = await client.query({ query: EPISODE_QUERY, variables: { id: "1" } });
    expect(detail?.episode?.name).toBe("Pilot");
    expect(detail?.episode?.characters.length).toBeGreaterThan(5);
  });
});
