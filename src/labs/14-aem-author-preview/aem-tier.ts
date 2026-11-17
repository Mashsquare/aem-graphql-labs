// Importing "server-only" makes the BUILD fail if a Client Component ever imports this file,
// so the Author credentials below can never be bundled for the browser.
import "server-only";
import { aemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";
import { ADVENTURES_QUERY, ALL_ADVENTURES_QUERY, type AemTarget, type PreviewAdventure } from "./types";

/**
 * Task 1 — choose the AEM tier.
 *   preview = false -> Publish, no credentials
 *   preview = true  -> Author with an Authorization header:
 *       AEM_AUTHOR_TOKEN set  -> "Bearer <token>"   (AEMaaCS developer token / service credentials)
 *       otherwise             -> "Basic base64(AEM_AUTHOR_USER:AEM_AUTHOR_PASSWORD)", default admin:admin
 */
export function getAemTarget(preview: boolean): AemTarget {
  void aemConfig;
  void preview;
  return todo("implement getAemTarget() in aem-tier.ts");
}

/**
 * Task 2 — run a query against the chosen tier. POST to `${target.host}${endpoint}` with the
 * target's headers; throw on non-2xx and on GraphQL errors. Use cache: "no-store" — previews
 * must never be cached.
 */
export async function queryTier<TData>(preview: boolean, query: string, variables?: Record<string, unknown>): Promise<TData> {
  void preview;
  void query;
  void variables;
  return todo("implement queryTier() in aem-tier.ts");
}

export async function getAdventures(preview: boolean): Promise<PreviewAdventure[]> {
  const data = await queryTier<{ adventureList: { items: PreviewAdventure[] } }>(preview, ALL_ADVENTURES_QUERY);
  return data.adventureList.items;
}

export async function getAdventureBySlug(slug: string, preview: boolean): Promise<PreviewAdventure | null> {
  const data = await queryTier<{ adventureList: { items: PreviewAdventure[] } }>(preview, ADVENTURES_QUERY, { slug });
  return data.adventureList.items[0] ?? null;
}
