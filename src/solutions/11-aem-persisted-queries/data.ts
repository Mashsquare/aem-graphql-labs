import { aemConfig } from "@/lib/aem/config";
import type { LabAdventure, LabAdventuresData } from "@/labs/11-aem-persisted-queries/queries";
import { createPublishClient } from "./aem-headless";

export function persistedQueryUrl(shortPath: string, variables: Record<string, unknown> = {}): string {
  const matrix = Object.entries(variables)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => `;${name}=${encodeURIComponent(typeof value === "string" ? value : JSON.stringify(value))}`)
    .join("");
  return `/graphql/execute.json/${shortPath}${matrix}`;
}

export async function getAdventuresByDifficulty(difficulty: string): Promise<LabAdventure[]> {
  const { data } = await createPublishClient().runPersistedQuery<LabAdventuresData>(`wknd-shared/lab-adventures-by-difficulty`, { difficulty });
  return data.adventureList.items;
}

export interface CacheInspection {
  url: string;
  status: number;
  cacheControl: string | null;
  surrogateControl: string | null;
}

export async function inspectPersistedQuery(shortPath: string, variables: Record<string, unknown> = {}): Promise<CacheInspection> {
  const url = `${aemConfig().publishHost}${persistedQueryUrl(shortPath, variables)}`;
  const response = await fetch(url, { cache: "no-store" });
  return {
    url,
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
    surrogateControl: response.headers.get("surrogate-control"),
  };
}
