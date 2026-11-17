import { param, type LabViewProps } from "@/lib/lab-view";
import { VariationsView } from "@/labs/12-aem-variations-locales/ui";
import { getAdventureMetadata, getAdventureVariation, getAllVariations, getLocalizedAdventures, metadataValue } from "./data";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <VariationsView
      api={{ getAdventureVariation, getAllVariations, getLocalizedAdventures, getAdventureMetadata, metadataValue }}
      slug={param(searchParams, "slug")}
      variation={param(searchParams, "variation")}
      locale={param(searchParams, "locale")}
    />
  );
}
