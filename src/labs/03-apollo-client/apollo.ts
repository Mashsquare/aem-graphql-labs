import { HttpLink, type TypePolicies } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { todo } from "@/lib/todo";
import type { EpisodesPage } from "./types";

export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

/**
 * Task 2 — teach the cache how `episodes` pages fit together.
 *
 * Without a policy, page 2 is stored under a different cache key than page 1
 * (`episodes({"page":2,...})`), so `fetchMore` would *replace* what you see.
 */
export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      // TODO: episodes: {
      //   keyArgs: [...],            // which arguments identify a *different list*? (not `page`!)
      //   merge(existing: EpisodesPage | undefined, incoming: EpisodesPage, { args }) { ... },
      // },
      episodes: {
        keyArgs: ["filter"],
        merge(existing: EpisodesPage | undefined, incoming: EpisodesPage, {args}){
          if(!existing || !args?.page || args.page === 1) return incoming;
          return { ...incoming, results: [...existing.results, ...incoming.results]}
        }
      }

    },
  },
};


export const makeClient = ():ApolloClient => {
  return new ApolloClient({
    cache: new InMemoryCache({typePolicies}),
    link: new HttpLink({uri: RICK_AND_MORTY_API})
  })
}
