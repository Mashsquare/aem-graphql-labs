import { request } from "graphql-request";
import { aemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";
import { adventureTeasersQuery } from "./documents";
import type { AdventureModelFilter, AdventureTeasersQuery } from "./gql/graphql";

export const aemEndpoint = () => `${aemConfig().publishHost}${aemConfig().endpoint}`;

/**
 * Task 3 — build an AEM filter object. `AdventureModelFilter` is GENERATED from the schema,
 * so typos like `_operater` or `value: 3` on a String filter are compile errors.
 */
export function teaserFilter(difficulty?: string): AdventureModelFilter | undefined {
  // TODO: return undefined without a difficulty, otherwise { difficulty: { _expressions: [{ value: difficulty }] } }
  void difficulty;
  return todo("implement teaserFilter() in data.ts");
}

/** Task 4 — run the typed document. graphql-request infers result and variable types from it. */
export async function getAdventureTeasers(difficulty?: string): Promise<AdventureTeasersQuery["adventureList"]["items"]> {
  // TODO: const data = await request(aemEndpoint(), adventureTeasersQuery, { filter: teaserFilter(difficulty) });
  //       return data.adventureList.items;
  void request;
  void adventureTeasersQuery;
  void difficulty;
  return todo("implement getAdventureTeasers() in data.ts (after updating the query and running codegen)");
}
