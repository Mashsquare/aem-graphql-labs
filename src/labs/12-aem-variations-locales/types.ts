/** Types for Lab 12 — provided. */

export interface AdventureVariation {
  _path: string;
  _variation: string;
  _variations: string[];
  title: string;
  price: number | null;
  tripLength: string | null;
  description: { plaintext: string | null } | null;
}

export interface VariationRow {
  _variation: string;
  title: string;
  price: number | null;
}

export interface LocalizedAdventure {
  _path: string;
  slug: string;
  title: string;
  tripLength: string | null;
}

export interface MetadataEntry<TValue> {
  name: string;
  value: TValue;
}

export interface TypedMetaData {
  stringMetadata: MetadataEntry<string | null>[];
  stringArrayMetadata: MetadataEntry<string[] | null>[];
  calendarMetadata: MetadataEntry<string | null>[];
}

export interface AdventureMetadata {
  _path: string;
  _model: { _path: string; title: string };
  _tags: string[] | null;
  _metadata: TypedMetaData;
}
