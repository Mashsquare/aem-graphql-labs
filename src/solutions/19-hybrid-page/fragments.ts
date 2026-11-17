import { aemQuery, type AemTier } from "@/lib/aem/client";
import type { ModelNode } from "@/lib/aem/page-model";
import type { Adventure, AdventuresByPathData } from "@/labs/19-hybrid-page/types";
import { childrenOf } from "@/lib/aem/spa";

const CARD = "wknd/components/adventurecard";

export function collectFragmentPaths(model: ModelNode): string[] {
  const found = new Set<string>(); // a Set keeps first-occurrence order
  const visit = (node: ModelNode) => {
    if (node[":type"] === CARD && typeof node.fragmentPath === "string" && node.fragmentPath) found.add(node.fragmentPath);
    // Follow the author's order so "first occurrence" means "first on the page".
    for (const child of childrenOf(node)) visit(child.model);
  };
  visit(model);
  return [...found];
}

export const ADVENTURES_BY_PATH_QUERY = /* GraphQL */ `
  query AdventuresByPath($filter: AdventureModelFilter!) {
    adventureList(_locale: "en", filter: $filter) {
      items {
        _path
        title
        slug
        activity
        difficulty
        price
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

export async function getAdventuresByPath(paths: string[], tier: AemTier = "publish"): Promise<Map<string, Adventure | null>> {
  const result = new Map<string, Adventure | null>(paths.map((path) => [path, null]));
  if (paths.length === 0) return result; // an empty filter would match everything
  const data = await aemQuery<AdventuresByPathData>(
    ADVENTURES_BY_PATH_QUERY,
    { filter: { _path: { _logOp: "OR", _expressions: paths.map((value) => ({ value })) } } },
    { tier },
  );
  for (const item of data.adventureList.items) {
    if (result.has(item._path)) result.set(item._path, item);
  }
  return result;
}
