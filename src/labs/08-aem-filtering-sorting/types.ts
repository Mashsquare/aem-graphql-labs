/** Types for Lab 08 — provided. */
import type { ImageRef } from "@/lib/aem/types";
import type { AdventureModelFilter } from "@/lib/aem/filter-types";

/** What the search form produces. */
export interface AdventureSearchCriteria {
  search?: string;
  activities: string[];
  difficulty?: string;
  maxPrice?: number;
  minGroupSize?: number;
  country?: string;
  departureAfter?: string;
}

export type AdventureSortKey = "title" | "price-asc" | "price-desc" | "departure";

export interface AdventureHit {
  __typename?: "AdventureModel";
  _path: string;
  title: string;
  activity: string | null;
  difficulty: string | null;
  price: number | null;
  groupSize: number | null;
  departureDate: string | null;
  primaryImage: (ImageRef & { __typename?: "ImageRef" }) | null;
  location: { __typename?: "LocationModel"; _path: string; city: string | null; country: string | null } | null;
}

export interface AdventureSearchData {
  adventureList: { items: AdventureHit[] };
}

export interface AdventureSearchVariables {
  filter?: AdventureModelFilter;
  sort?: string;
  locale?: string;
}

export interface CountriesData {
  locationList: { items: { _path: string; country: string | null }[] };
}
