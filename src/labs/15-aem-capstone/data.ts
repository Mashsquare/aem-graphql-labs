import { aemPersistedQuery } from "@/lib/aem/client";
import { todo } from "@/lib/todo";
import { PERSISTED_ADVENTURES_ALL, PERSISTED_ADVENTURE_BY_SLUG } from "./documents";
import type { AdventureBySlugQuery, AdventuresAllQuery } from "./gql/graphql";
import type { AdventureDetail, AdventureListItem } from "./types";

/** Cache tags: one for "any adventure list", one per adventure page. */
export const ADVENTURES_TAG = "aem:adventures";
export const adventureTag = (slug: string) => `aem:adventure:${slug}`;

/**
 * Task 1 — all English adventures through the persisted query PERSISTED_ADVENTURES_ALL
 * (aemPersistedQuery<AdventuresAllQuery>(…, { locale: "en" })). Drop null items.
 */
export async function fetchAdventures(): Promise<AdventureListItem[]> {
  void aemPersistedQuery;
  void PERSISTED_ADVENTURES_ALL;
  return todo("implement fetchAdventures() in data.ts");
}

/** Task 2 — one adventure + its _references via PERSISTED_ADVENTURE_BY_SLUG, or null. */
export async function fetchAdventure(slug: string): Promise<AdventureDetail | null> {
  void slug;
  void PERSISTED_ADVENTURE_BY_SLUG;
  return todo("implement fetchAdventure() in data.ts");
}

/**
 * Task 3 — cached versions for the pages:
 *   "use cache"; cacheLife("hours"); cacheTag(ADVENTURES_TAG)                     -> getAdventures()
 *   "use cache"; cacheLife("hours"); cacheTag(ADVENTURES_TAG, adventureTag(slug)) -> getAdventure(slug)
 * (import { cacheLife, cacheTag } from "next/cache")
 */
export async function getAdventures(): Promise<AdventureListItem[]> {
  return todo("implement getAdventures() in data.ts");
}

export async function getAdventure(slug: string): Promise<AdventureDetail | null> {
  void slug;
  return todo("implement getAdventure() in data.ts");
}
