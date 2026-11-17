import { gql, type TypedDocumentNode, type TypePolicies } from "@apollo/client";
import { aemQuery } from "@/lib/aem/client";
import { todo } from "@/lib/todo";
import type { AdventuresConnectionData, AdventuresConnectionVariables } from "./types";

/**
 * Part B — cursor paging with adventurePaginated (Relay-style connection).
 *   adventurePaginated(first: Int, after: String, sort, filter, _locale) {
 *     edges { cursor node { ... } }
 *     pageInfo { startCursor endCursor hasNextPage hasPreviousPage }
 *   }
 * `first` defaults to 50 and may not exceed 100.
 */
export const ADVENTURES_CONNECTION_QUERY: TypedDocumentNode<AdventuresConnectionData, AdventuresConnectionVariables> = gql`
  # TODO: query AdventuresConnection($first: Int!, $after: String) { adventurePaginated(_locale: "en", sort: "title ASC", ...) { ... } }
  query AdventuresConnectionTodo {
    __typename
  }
`;

/**
 * Task — the cache policy for the connection. Apollo ships one: relayStylePagination(keyArgs)
 * from "@apollo/client/utilities". keyArgs = the arguments that make it a DIFFERENT list
 * (not first/after). Also identify AdventureModel by _path.
 */
export const paginationTypePolicies: TypePolicies = {
  // TODO: Query: { fields: { adventurePaginated: relayStylePagination(["_locale", "sort", "filter"]) } },
  // TODO: AdventureModel: { keyFields: ["_path"] },
};

/**
 * Server-side cursor walk: follow endCursor until hasNextPage is false.
 * (This is what the AEM Headless SDK's runPaginatedQuery() generator does for you.)
 */
export async function fetchAllAdventureTitles(pageSize: number): Promise<string[]> {
  void aemQuery;
  void pageSize;
  return todo("implement fetchAllAdventureTitles() in cursor.ts");
}
