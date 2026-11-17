import { todo } from "@/lib/todo";
import type { AemTier } from "@/lib/aem/client";
import type { HybridPage } from "./types";

/**
 * Task 4 — the data loader of the hybrid page.
 *
 *   1. the page model            fetchPageModel(pagePath, tier)    from "@/lib/aem/sites"
 *   2. the fragments it needs    collectFragmentPaths(model)       (Task 1)
 *   3. their content             getAdventuresByPath(paths, tier)  (Task 2)  — ONE request, not one per card
 *
 * Steps 1 and 3 depend on each other, so they run one after the other; do not start more requests than that.
 * Return { model, adventures }.
 */
export async function loadHybridPage(pagePath: string, tier: AemTier = "publish"): Promise<HybridPage> {
  void pagePath;
  void tier;
  return todo("implement loadHybridPage in page.ts");
}
