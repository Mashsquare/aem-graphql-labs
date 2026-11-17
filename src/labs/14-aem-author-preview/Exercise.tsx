import { param, type LabViewProps } from "@/lib/lab-view";
import { getAdventureBySlug, getAdventures } from "./aem-tier";
import { WORKSPACE } from "./draft-route";
import { PreviewView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return (
    <PreviewView
      api={{ getAdventures, getAdventureBySlug, draftRoute: "/api/lab14/draft", returnTo: WORKSPACE }}
      slug={param(searchParams, "slug")}
    />
  );
}
