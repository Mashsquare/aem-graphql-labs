import { param, type LabViewProps } from "@/lib/lab-view";
import { PreviewView } from "@/labs/14-aem-author-preview/ui";
import { getAdventureBySlug, getAdventures } from "./aem-tier";
import { WORKSPACE } from "./draft-route";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <PreviewView
      api={{ getAdventures, getAdventureBySlug, draftRoute: "/api/solutions/lab14/draft", returnTo: WORKSPACE }}
      slug={param(searchParams, "slug")}
    />
  );
}
