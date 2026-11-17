import { Client, gql, type TypedDocumentNode } from "urql";
import { todo } from "@/lib/todo";
import type { ContinentsData, CountriesData, CountriesVariables } from "./types";

export const COUNTRIES_API = "https://countries.trevorblades.com/graphql";

/**
 * Task 1 — the urql client.
 * urql processes every operation through a pipeline of "exchanges". The classic setup is
 * [cacheExchange, fetchExchange]: answer from the document cache if possible, otherwise fetch.
 */
export function createUrqlClient(): Client {
  // TODO: return new Client({ url: COUNTRIES_API, exchanges: [cacheExchange, fetchExchange], preferGetMethod: ... })
  void Client;
  return todo("implement createUrqlClient() in urql.ts");
}

/* Task 2 — documents. urql's gql<Data, Variables>`...` returns a TypedDocumentNode. */

export const CONTINENTS_QUERY: TypedDocumentNode<ContinentsData, Record<string, never>> = gql`
  # TODO: query Continents { continents { code name } }
  query ContinentsTodo {
    __typename
  }
`;

export const COUNTRIES_QUERY: TypedDocumentNode<CountriesData, CountriesVariables> = gql`
  # TODO: query CountriesByContinent($continent: String!) — filter: { continent: { eq: $continent } }
  query CountriesTodo {
    __typename
  }
`;
