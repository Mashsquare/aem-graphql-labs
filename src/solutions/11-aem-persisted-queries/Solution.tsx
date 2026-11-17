import { param, type LabViewProps } from "@/lib/lab-view";
import { PersistedQueriesView } from "@/labs/11-aem-persisted-queries/ui";
import { ADVENTURES_TAG, getCachedAdventures } from "./cached";
import { inspectPersistedQuery, persistedQueryUrl } from "./data";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <PersistedQueriesView
      api={{
        getCachedAdventures,
        inspectPersistedQuery,
        persistedQueryUrl,
        cacheTag: ADVENTURES_TAG,
        files: ["src/solutions/11-aem-persisted-queries/data.ts", "src/solutions/11-aem-persisted-queries/cached.ts"],
      }}
      difficulty={param(searchParams, "difficulty")}
    />
  );
}
