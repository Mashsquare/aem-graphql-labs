import { aemQuery } from "@/lib/aem/client";
import { todo } from "@/lib/todo";
import type { AdventureMetadata, AdventureVariation, LocalizedAdventure, TypedMetaData, VariationRow } from "./types";

/**
 * Task 1 — one adventure, in a given variation and language.
 *   adventureList(_locale: $locale, variation: $variation, filter: { slug: … }) { items { _variation _variations … } }
 * If the fragment has no such variation, AEM silently returns master (_variation: "master").
 */
export const ADVENTURE_VARIATION_QUERY = /* GraphQL */ `
  # TODO: query AdventureVariation($slug: String!, $variation: String, $locale: String!) { ... }
`;

export async function getAdventureVariation(slug: string, variation?: string, locale = "en"): Promise<AdventureVariation | null> {
  void aemQuery;
  void slug;
  void variation;
  void locale;
  return todo("implement getAdventureVariation() in data.ts");
}

/** Task 2 — master AND every variation as separate items: includeVariations: true. */
export const ALL_VARIATIONS_QUERY = /* GraphQL */ `
  # TODO: query AllVariations($slug: String!) { adventureList(_locale: "en", includeVariations: true, filter: …) { items { _variation title price } } }
`;

export async function getAllVariations(slug: string): Promise<VariationRow[]> {
  void slug;
  return todo("implement getAllVariations() in data.ts");
}

/** Task 3 — the adventures of one language copy (/content/dam/wknd-shared/<locale>/…). */
export const LOCALIZED_ADVENTURES_QUERY = /* GraphQL */ `
  # TODO: query LocalizedAdventures($locale: String!) { adventureList(_locale: $locale, sort: "title ASC") { items { _path slug title tripLength } } }
`;

export async function getLocalizedAdventures(locale: string): Promise<LocalizedAdventure[]> {
  void locale;
  return todo("implement getLocalizedAdventures() in data.ts");
}

/**
 * Task 4 — fragment-level information that is not part of the model:
 *   _model { _path title }, _tags, _metadata { stringMetadata { name value } stringArrayMetadata { name value } calendarMetadata { name value } }
 */
export const ADVENTURE_METADATA_QUERY = /* GraphQL */ `
  # TODO: query AdventureMetadata($path: String!) { adventureByPath(_path: $path) { item { ... } } }
`;

export async function getAdventureMetadata(path: string): Promise<AdventureMetadata | null> {
  void path;
  return todo("implement getAdventureMetadata() in data.ts");
}

/** Task 5 — metadata comes as typed name/value lists. Find a value by name in any of them. */
export function metadataValue(metadata: TypedMetaData, name: string): string | string[] | null | undefined {
  void metadata;
  void name;
  return todo("implement metadataValue() in data.ts");
}
