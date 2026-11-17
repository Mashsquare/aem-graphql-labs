import { request } from "graphql-request";
import { aemConfig } from "@/lib/aem/config";
import { adventureTeasersQuery } from "./documents";
import type { AdventureModelFilter } from "./gql/graphql";

export const aemEndpoint = () => `${aemConfig().publishHost}${aemConfig().endpoint}`;

export function teaserFilter(difficulty?: string): AdventureModelFilter | undefined {
  if (!difficulty) return undefined;
  return { difficulty: { _expressions: [{ value: difficulty }] } };
}

export async function getAdventureTeasers(difficulty?: string) {
  // Result AND variables are inferred from the generated TypedDocumentNode:
  // `filter` must be an AdventureModelFilter, `data.adventureList.items` is typed.
  const data = await request(aemEndpoint(), adventureTeasersQuery, { filter: teaserFilter(difficulty) });
  return data.adventureList.items;
}
