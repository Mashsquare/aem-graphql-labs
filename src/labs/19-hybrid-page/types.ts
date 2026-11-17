/** Types for Lab 19 — provided. */
import type { PageModel } from "@/lib/aem/page-model";

/** What the author sets in the card's dialog — this is all the page model contains. */
export interface AuthoredCard {
  /** Repository path of a Content Fragment. Missing until the author has picked one. */
  fragmentPath?: string;
  /** A checkbox: absent or false = hidden. */
  showPrice?: boolean;
  layout?: string;
}

/** What GraphQL returns for the fragment. */
export interface Adventure {
  _path: string;
  title: string;
  slug: string;
  activity: string | null;
  difficulty: string | null;
  price: number | null;
  primaryImage: { _dynamicUrl: string | null; width: number | null; height: number | null } | null;
}

export interface AdventuresByPathData {
  adventureList: { items: Adventure[] };
}

/** What the React card renders — content from the fragment, presentation from the dialog. */
export interface CardViewModel {
  title: string;
  href: string;
  meta: string;
  image: { src: string; width: number | null; height: number | null } | null;
  /** null when the dialog says "hide the price" or the fragment has none */
  price: number | null;
  layout: "full" | "compact";
}

export interface HybridPage {
  model: PageModel;
  /** fragment path -> adventure, or null when AEM does not return it on this tier (draft, deleted, wrong path) */
  adventures: Map<string, Adventure | null>;
}
