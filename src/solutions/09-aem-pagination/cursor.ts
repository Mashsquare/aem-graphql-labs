import { gql, type TypedDocumentNode, type TypePolicies } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { print } from "graphql";
import { aemQuery } from "@/lib/aem/client";
import type { AdventuresConnectionData, AdventuresConnectionVariables } from "@/labs/09-aem-pagination/types";

export const ADVENTURES_CONNECTION_QUERY: TypedDocumentNode<AdventuresConnectionData, AdventuresConnectionVariables> = gql`
  query AdventuresConnection($first: Int!, $after: String) {
    adventurePaginated(_locale: "en", sort: "title ASC", first: $first, after: $after) {
      edges {
        cursor
        node {
          _path
          title
          activity
          price
          primaryImage {
            ... on ImageRef {
              _dynamicUrl
            }
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const paginationTypePolicies: TypePolicies = {
  Query: {
    fields: {
      // Same _locale/sort/filter = same list; first/after only move through it.
      adventurePaginated: relayStylePagination(["_locale", "sort", "filter"]),
    },
  },
  AdventureModel: { keyFields: ["_path"] },
};

export async function fetchAllAdventureTitles(pageSize: number): Promise<string[]> {
  const titles: string[] = [];
  let after: string | null = null;
  // Guard against a server that never says hasNextPage: false.
  for (let pageCount = 0; pageCount < 100; pageCount++) {
    const data: AdventuresConnectionData = await aemQuery<AdventuresConnectionData>(print(ADVENTURES_CONNECTION_QUERY), { first: pageSize, after });
    const { edges, pageInfo } = data.adventurePaginated;
    titles.push(...edges.map((edge) => edge.node.title));
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
  }
  return titles;
}
