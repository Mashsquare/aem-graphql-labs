import { aemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";
import type { AdventureByPathData, AdventureCard, AdventureCardsData, AdventureDetail, GraphQLResponse } from "./types";



/**
 * Task 1 — where is the AEM GraphQL endpoint?
 * Publish host + /content/cq:graphql/<configuration>/endpoint.json
 * Read the values from aemConfig() *inside* the function (tests point it at a private mock).
 */
export function aemGraphQLUrl(): string {
  const {publishHost, endpoint} = aemConfig();
  const url = new URL(endpoint, publishHost).toString();
  return url;

}

/**
 * Task 2 — POST a query to AEM. AEM answers HTTP 200 for invalid queries and puts the problem in
 * `errors` (each with extensions.classification, e.g. "ValidationError") — throw on those.
 */
export async function aemGraphQL<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const response = await fetch(aemGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({query, variables})
  });
  if(!response.ok){
    throw new Error(response.status.toString());
  }
  const body: GraphQLResponse<TData> = await response.json();
  if(body.errors?.length && body.errors?.length > 0){
    const message = body.errors
    .map(error => `[${error.extensions?.classification ?? "UnknownError"}] ${error.message}`)
    .join("; ");
    throw new Error(message);
  }
  return body.data as TData;
}

const ADVENTURE_CARD_FRAGMENT = /* GraphQL */ `
  fragment AdventureCardFields on AdventureModel {
    _path
    title
    slug
    activity
    price
    tripLength
    primaryImage {
      ... on ImageRef {
        _path
        _dynamicUrl
        mimeType
        width
        height
      }
    }
  }
`;

/** Task 3 — every English adventure as a card, sorted by title. */
export const ADVENTURE_CARDS_QUERY = /* GraphQL */ `
    query AdventureCards{
      adventureList(_locale:"en", sort: "title ASC"){
        items {
         ...AdventureCardFields
        }
      }
  }
  ${ADVENTURE_CARD_FRAGMENT}
`;

export async function getAdventureCards(): Promise<AdventureCard[]> {
  const data = await aemGraphQL<AdventureCardsData>(ADVENTURE_CARDS_QUERY);
  return data.adventureList.items;
}

/** Task 4 — one adventure by its repository path. */
export const ADVENTURE_BY_PATH_QUERY = /* GraphQL */ `
  query AdventureByPath($path: String!) {
    adventureByPath(_path: $path) {
      item {
        ...AdventureCardFields
        difficulty
        groupSize
        description {
          plaintext
        }
        location {
          name
          city
          country
        }
      }
    }
  }
  ${ADVENTURE_CARD_FRAGMENT}
`;

export async function getAdventureByPath(path: string): Promise<AdventureDetail | null> {
  const data = await aemGraphQL<AdventureByPathData>(ADVENTURE_BY_PATH_QUERY,{path});
  return data.adventureByPath.item;
}

/** Task 5 — _dynamicUrl is relative ("/adobe/dynamicmedia/deliver/…"). Make it absolute on Publish. */
export function toPublishUrl(dynamicUrl: string): string {
  return new URL(dynamicUrl, aemConfig().publishHost.toString()).toString();
}
