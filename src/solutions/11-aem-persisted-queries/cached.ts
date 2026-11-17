import { cacheLife, cacheTag } from "next/cache";
import type { LabAdventure } from "@/labs/11-aem-persisted-queries/queries";
import { getAdventuresByDifficulty } from "./data";

export const ADVENTURES_TAG = "aem:solution11:adventures";

export async function getCachedAdventures(difficulty: string): Promise<{ items: LabAdventure[]; fetchedAt: string }> {
  "use cache";
  // `difficulty` is an argument, so it is part of the cache key automatically.
  cacheLife({ stale: 60, revalidate: 120, expire: 3600 });
  cacheTag(ADVENTURES_TAG);
  return { items: await getAdventuresByDifficulty(difficulty), fetchedAt: new Date().toISOString() };
}
