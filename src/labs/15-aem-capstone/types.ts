/** Types for the capstone — derived from the GENERATED query types, never written by hand. */
import type { AdventureBySlugQuery, AdventuresAllQuery } from "./gql/graphql";

export type AdventureListItem = NonNullable<AdventuresAllQuery["adventureList"]["items"][number]>;

export type AdventureDetailItem = NonNullable<AdventureBySlugQuery["adventureList"]["items"][number]>;

export interface AdventureDetail {
  adventure: AdventureDetailItem;
  references: AdventureBySlugQuery["adventureList"]["_references"];
}

/** The CloudEvent the (mock) AEM Eventing integration POSTs to /api/aem-events. */
export interface AemEvent {
  specversion?: string;
  id?: string;
  type: string;
  source?: string;
  time?: string;
  data: { path?: string; id?: string; model?: string; slug?: string | null; shortPath?: string; user?: string };
}
