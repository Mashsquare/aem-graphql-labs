import { todo } from "@/lib/todo";
import { getAdventuresByDifficulty } from "./data";
import type { LabAdventure } from "./queries";

export const ADVENTURES_TAG = "aem:lab11:adventures";

/**
 * Task 6 — cache the AEM response in Next.js (Cache Components).
 *
 *   "use cache"                       at the top of the function body
 *   cacheLife({ stale: 60, revalidate: 120, expire: 3600 })   mirror AEM's max-age
 *   cacheTag(ADVENTURES_TAG)          so a publish webhook can invalidate it (Lab 15)
 *
 * Return when it was fetched so the UI can show whether you got a cached copy.
 * (import { cacheLife, cacheTag } from "next/cache")
 */
export async function getCachedAdventures(difficulty: string): Promise<{ items: LabAdventure[]; fetchedAt: string }> {
  void getAdventuresByDifficulty;
  void difficulty;
  return todo("implement getCachedAdventures() in cached.ts");
}
