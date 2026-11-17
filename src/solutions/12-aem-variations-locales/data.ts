import { aemQuery } from "@/lib/aem/client";
import type {
  AdventureMetadata,
  AdventureVariation,
  LocalizedAdventure,
  TypedMetaData,
  VariationRow,
} from "@/labs/12-aem-variations-locales/types";

export const ADVENTURE_VARIATION_QUERY = /* GraphQL */ `
  query AdventureVariation($slug: String!, $variation: String, $locale: String!) {
    adventureList(_locale: $locale, variation: $variation, filter: { slug: { _expressions: [{ value: $slug }] } }) {
      items {
        _path
        _variation
        _variations
        title
        price
        tripLength
        description {
          plaintext
        }
      }
    }
  }
`;

export async function getAdventureVariation(slug: string, variation?: string, locale = "en"): Promise<AdventureVariation | null> {
  const data = await aemQuery<{ adventureList: { items: AdventureVariation[] } }>(ADVENTURE_VARIATION_QUERY, { slug, variation, locale });
  return data.adventureList.items[0] ?? null;
}

export const ALL_VARIATIONS_QUERY = /* GraphQL */ `
  query AllVariations($slug: String!) {
    adventureList(_locale: "en", includeVariations: true, filter: { slug: { _expressions: [{ value: $slug }] } }) {
      items {
        _variation
        title
        price
      }
    }
  }
`;

export async function getAllVariations(slug: string): Promise<VariationRow[]> {
  return (await aemQuery<{ adventureList: { items: VariationRow[] } }>(ALL_VARIATIONS_QUERY, { slug })).adventureList.items;
}

export const LOCALIZED_ADVENTURES_QUERY = /* GraphQL */ `
  query LocalizedAdventures($locale: String!) {
    adventureList(_locale: $locale, sort: "title ASC") {
      items {
        _path
        slug
        title
        tripLength
      }
    }
  }
`;

export async function getLocalizedAdventures(locale: string): Promise<LocalizedAdventure[]> {
  return (await aemQuery<{ adventureList: { items: LocalizedAdventure[] } }>(LOCALIZED_ADVENTURES_QUERY, { locale })).adventureList.items;
}

export const ADVENTURE_METADATA_QUERY = /* GraphQL */ `
  query AdventureMetadata($path: String!) {
    adventureByPath(_path: $path) {
      item {
        _path
        _model {
          _path
          title
        }
        _tags
        _metadata {
          stringMetadata {
            name
            value
          }
          stringArrayMetadata {
            name
            value
          }
          calendarMetadata {
            name
            value
          }
        }
      }
    }
  }
`;

export async function getAdventureMetadata(path: string): Promise<AdventureMetadata | null> {
  return (await aemQuery<{ adventureByPath: { item: AdventureMetadata | null } }>(ADVENTURE_METADATA_QUERY, { path })).adventureByPath.item;
}

export function metadataValue(metadata: TypedMetaData, name: string): string | string[] | null | undefined {
  // Metadata is split by value type; the name decides, not the list.
  const entries = [...metadata.stringMetadata, ...metadata.stringArrayMetadata, ...metadata.calendarMetadata];
  return entries.find((entry) => entry.name === name)?.value;
}
