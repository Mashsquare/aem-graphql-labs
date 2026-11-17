import { todo } from "@/lib/todo";
import type { ModelNode } from "@/lib/aem/page-model";
import type { Adventure } from "./types";
import type { AemTier } from "@/lib/aem/client";

/**
 * Task 1 — which fragments does this page need? Walk the page model (`:items`, any depth, in document
 * order) and collect `fragmentPath` of every node whose `:type` is "wknd/components/adventurecard".
 *
 *  - skip cards without a fragmentPath (the author has not picked one yet), and non-string values
 *  - each path once (two cards may show the same adventure)
 *  - order: first occurrence
 */
export function collectFragmentPaths(model: ModelNode): string[] {
  void model;
  return todo("implement collectFragmentPaths in fragments.ts");
}

/**
 * Task 2a — ONE query for all fragments. A filter on `_path` with several expressions joined by OR:
 *
 *   query AdventuresByPath($filter: AdventureModelFilter!) {
 *     adventureList(_locale: "en", filter: $filter) { items { _path title slug activity difficulty price
 *       primaryImage { ... on ImageRef { _dynamicUrl width height } } } }
 *   }
 *   variables: { filter: { _path: { _logOp: OR, _expressions: [{ value: "/content/dam/…/a" }, { value: "…/b" }] } } }
 */
export const ADVENTURES_BY_PATH_QUERY = /* GraphQL */ `
  query AdventuresByPath {
    # TODO
    __typename
  }
`;

/**
 * Task 2b — run it (aemQuery from "@/lib/aem/client") and return a Map with an entry for EVERY path you were
 * asked for: the adventure, or null when AEM did not return it (a draft on Publish, a typo, a deleted fragment).
 *
 * Careful: an empty `_expressions` list does not mean "nothing" — it can mean "no filter", i.e. every
 * adventure. With no paths, send no request at all and return an empty Map.
 */
export async function getAdventuresByPath(paths: string[], tier: AemTier = "publish"): Promise<Map<string, Adventure | null>> {
  void paths;
  void tier;
  return todo("implement getAdventuresByPath in fragments.ts");
}
