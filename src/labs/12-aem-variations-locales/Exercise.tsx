import { param, type LabViewProps } from "@/lib/lab-view";
import { getAdventureMetadata, getAdventureVariation, getAllVariations, getLocalizedAdventures, metadataValue } from "./data";
import { VariationsView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return (
    <VariationsView
      api={{ getAdventureVariation, getAllVariations, getLocalizedAdventures, getAdventureMetadata, metadataValue }}
      slug={param(searchParams, "slug")}
      variation={param(searchParams, "variation")}
      locale={param(searchParams, "locale")}
    />
  );
}
