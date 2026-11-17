import { aemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";
import { createPublishClient } from "./aem-headless";
import type { LabAdventure } from "./queries";

/**
 * Task 3 — build a persisted query URL by hand (so you know what the SDK does):
 *   /graphql/execute.json/<config>/<name>;var1=value1;var2=value2
 * - values are encodeURIComponent()-ed (a value may contain ; = / ? & …)
 * - non-string values are JSON.stringify()-ed first
 * - undefined/null variables are left out
 */
export function persistedQueryUrl(shortPath: string, variables: Record<string, unknown> = {}): string {
  void shortPath;
  void variables;
  return todo("implement persistedQueryUrl() in data.ts");
}

/** Task 4 — run the persisted query on Publish through the SDK. */
export async function getAdventuresByDifficulty(difficulty: string): Promise<LabAdventure[]> {
  void createPublishClient;
  void difficulty;
  return todo("implement getAdventuresByDifficulty() in data.ts");
}

export interface CacheInspection {
  url: string;
  status: number;
  cacheControl: string | null;
  surrogateControl: string | null;
}

/** Task 5 — GET the persisted query yourself and report the caching headers AEM sends. */
export async function inspectPersistedQuery(shortPath: string, variables: Record<string, unknown> = {}): Promise<CacheInspection> {
  void aemConfig;
  void shortPath;
  void variables;
  return todo("implement inspectPersistedQuery() in data.ts");
}
