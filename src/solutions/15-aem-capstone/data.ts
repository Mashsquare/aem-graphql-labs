import { cacheLife, cacheTag } from "next/cache";
import { aemPersistedQuery } from "@/lib/aem/client";
import type { AdventureDetail, AdventureListItem } from "@/labs/15-aem-capstone/types";
import { PERSISTED_ADVENTURES_ALL, PERSISTED_ADVENTURE_BY_SLUG } from "./documents";
import type { AdventureBySlugQuery, AdventuresAllQuery } from "./gql/graphql";

// Separate tags from the exercise so the solution's webhook never "fixes" your site by accident.
export const ADVENTURES_TAG = "aem:solution:adventures";
export const adventureTag = (slug: string) => `aem:solution:adventure:${slug}`;

export async function fetchAdventures(): Promise<AdventureListItem[]> {
  const data = await aemPersistedQuery<AdventuresAllQuery>(PERSISTED_ADVENTURES_ALL, { locale: "en" });
  return data.adventureList.items.filter((item) => item !== null);
}

export async function fetchAdventure(slug: string): Promise<AdventureDetail | null> {
  const data = await aemPersistedQuery<AdventureBySlugQuery>(PERSISTED_ADVENTURE_BY_SLUG, { slug });
  const adventure = data.adventureList.items[0];
  return adventure ? { adventure, references: data.adventureList._references } : null;
}

export async function getAdventures(): Promise<AdventureListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(ADVENTURES_TAG);
  return fetchAdventures();
}

export async function getAdventure(slug: string): Promise<AdventureDetail | null> {
  "use cache";
  cacheLife("hours");
  // Tagged twice: invalidated by its own publish event and by "something in the list changed".
  cacheTag(ADVENTURES_TAG, adventureTag(slug));
  return fetchAdventure(slug);
}
