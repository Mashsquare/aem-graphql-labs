import type { AemTier } from "@/lib/aem/client";
import { fetchPageModel } from "@/lib/aem/sites";
import type { HybridPage } from "@/labs/19-hybrid-page/types";
import { collectFragmentPaths, getAdventuresByPath } from "./fragments";

export async function loadHybridPage(pagePath: string, tier: AemTier = "publish"): Promise<HybridPage> {
  const model = await fetchPageModel(pagePath, tier);
  const adventures = await getAdventuresByPath(collectFragmentPaths(model), tier);
  return { model, adventures };
}
