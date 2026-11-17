import { param, type LabViewProps } from "@/lib/lab-view";
import { FirstQueryView } from "@/labs/07-aem-first-query/ui";
import {
  ADVENTURE_BY_PATH_QUERY,
  ADVENTURE_CARDS_QUERY,
  aemGraphQLUrl,
  getAdventureByPath,
  getAdventureCards,
  toPublishUrl,
} from "./aem";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <FirstQueryView
      api={{
        endpoint: aemGraphQLUrl,
        getAdventureCards,
        getAdventureByPath,
        toPublishUrl,
        cardsQuery: ADVENTURE_CARDS_QUERY,
        byPathQuery: ADVENTURE_BY_PATH_QUERY,
      }}
      selectedPath={param(searchParams, "path")}
    />
  );
}
