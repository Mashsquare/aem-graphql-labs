import { HttpLink, type TypePolicies } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import type { EpisodesPage } from "@/labs/03-apollo-client/types";

export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      episodes: {
        // A different filter is a different list; a different page is the SAME list.
        keyArgs: ["filter"],
        merge(existing: EpisodesPage | undefined, incoming: EpisodesPage, { args }) {
          const page = (args?.page as number | undefined) ?? 1;
          // Page 1 (first load or refetch) starts over; later pages append.
          if (!existing || page === 1) return incoming;
          return { ...incoming, results: [...existing.results, ...incoming.results] };
        },
      },
    },
  },
};

export function makeClient(): ApolloClient {
  return new ApolloClient({
    cache: new InMemoryCache({ typePolicies }),
    link: new HttpLink({ uri: RICK_AND_MORTY_API }),
  });
}
