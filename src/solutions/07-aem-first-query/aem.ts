import { aemConfig } from "@/lib/aem/config";
import type { AdventureByPathData, AdventureCard, AdventureCardsData, AdventureDetail } from "@/labs/07-aem-first-query/types";

export function aemGraphQLUrl(): string {
  const { publishHost, endpoint } = aemConfig();
  // e.g. http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.json
  return `${publishHost}${endpoint}`;
}

interface AemError {
  message: string;
  extensions?: { classification?: string };
}

export async function aemGraphQL<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const response = await fetch(aemGraphQLUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`AEM GraphQL: HTTP ${response.status} ${response.statusText}`);

  const body = (await response.json()) as { data?: TData; errors?: AemError[] };
  if (body.errors?.length) {
    const details = body.errors.map((error) => `${error.extensions?.classification ?? "Error"}: ${error.message}`);
    throw new Error(`AEM GraphQL: ${details.join("; ")}`);
  }
  if (!body.data) throw new Error("AEM GraphQL: no data in response");
  return body.data;
}

export const ADVENTURE_CARDS_QUERY = /* GraphQL */ `
  query AdventureCards {
    adventureList(_locale: "en", sort: "title ASC") {
      items {
        _path
        title
        slug
        activity
        price
        tripLength
        primaryImage {
          ... on ImageRef {
            _dynamicUrl
            width
            height
          }
        }
      }
    }
  }
`;

export async function getAdventureCards(): Promise<AdventureCard[]> {
  const data = await aemGraphQL<AdventureCardsData>(ADVENTURE_CARDS_QUERY);
  return data.adventureList.items;
}

export const ADVENTURE_BY_PATH_QUERY = /* GraphQL */ `
  query AdventureByPath($path: String!) {
    adventureByPath(_path: $path) {
      item {
        _path
        title
        slug
        activity
        difficulty
        groupSize
        price
        tripLength
        description {
          plaintext
        }
        primaryImage {
          ... on ImageRef {
            _dynamicUrl
            width
            height
          }
        }
        location {
          name
          city
          country
        }
      }
    }
  }
`;

export async function getAdventureByPath(path: string): Promise<AdventureDetail | null> {
  const data = await aemGraphQL<AdventureByPathData>(ADVENTURE_BY_PATH_QUERY, { path });
  // ByPath returns { item: null } for unknown (or unpublished) paths — not an error.
  return data.adventureByPath.item;
}

export function toPublishUrl(dynamicUrl: string): string {
  return new URL(dynamicUrl, aemConfig().publishHost).toString();
}
