import { param, type LabViewProps } from "@/lib/lab-view";
import {
  ADVENTURE_BY_PATH_QUERY,
  ADVENTURE_CARDS_QUERY,
  aemGraphQLUrl,
  getAdventureByPath,
  getAdventureCards,
  toPublishUrl,
} from "./aem";
import { FirstQueryView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
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
