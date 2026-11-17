/** Result types for Lab 07 — provided, matching the data shapes in PROMPT.md. */
import type { ImageRef } from "@/lib/aem/types";

export interface AdventureCard {
  _path: string;
  title: string;
  slug: string;
  activity: string | null;
  price: number | null;
  tripLength: string | null;
  primaryImage: ImageRef | null;
}

export interface AdventureDetail extends AdventureCard {
  difficulty: string | null;
  groupSize: number | null;
  description: { plaintext: string | null } | null;
  location: { name: string; city: string | null; country: string | null } | null;
}

export interface AdventureCardsData {
  adventureList: { items: AdventureCard[] };
}

export interface AdventureByPathData {
  adventureByPath: { item: AdventureDetail | null };
}

export interface GraphQLError {
  message: string;
  extensions?: {classification?: string}
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}
