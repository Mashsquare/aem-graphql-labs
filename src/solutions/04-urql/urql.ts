import { Client, cacheExchange, fetchExchange, gql, type TypedDocumentNode } from "urql";
import type { ContinentsData, CountriesData, CountriesVariables } from "@/labs/04-urql/types";

export const COUNTRIES_API = "https://countries.trevorblades.com/graphql";

export function createUrqlClient(): Client {
  return new Client({
    url: COUNTRIES_API,
    // Order matters: the cache answers first, fetch only runs on a miss.
    exchanges: [cacheExchange, fetchExchange],
    // Queries go out as GET (?query=...&variables=...) unless the URL would exceed 2048 chars.
    // GET responses can be cached by browsers and CDNs — the same reason AEM uses GET for persisted queries.
    preferGetMethod: "within-url-limit",
  });
}

export const CONTINENTS_QUERY: TypedDocumentNode<ContinentsData, Record<string, never>> = gql`
  query Continents {
    continents {
      code
      name
    }
  }
`;

export const COUNTRIES_QUERY: TypedDocumentNode<CountriesData, CountriesVariables> = gql`
  query CountriesByContinent($continent: String!) {
    countries(filter: { continent: { eq: $continent } }) {
      code
      name
      emoji
      capital
      currency
    }
  }
`;
