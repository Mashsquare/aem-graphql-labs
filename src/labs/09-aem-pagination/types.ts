/** Types for Lab 09 — provided. */
import type { Connection, ImageRef } from "@/lib/aem/types";

export interface AdventureRow {
  __typename?: "AdventureModel";
  _path: string;
  title: string;
  activity: string | null;
  price: number | null;
  primaryImage: ImageRef | null;
}

export interface AdventurePageData {
  adventureList: { items: AdventureRow[] };
}

export interface OffsetPage {
  items: AdventureRow[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface AdventuresConnectionData {
  adventurePaginated: Connection<AdventureRow>;
}

export interface AdventuresConnectionVariables {
  first: number;
  after?: string | null;
}
