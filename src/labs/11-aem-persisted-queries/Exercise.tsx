import { param, type LabViewProps } from "@/lib/lab-view";
import { ADVENTURES_TAG, getCachedAdventures } from "./cached";
import { inspectPersistedQuery, persistedQueryUrl } from "./data";
import { PersistedQueriesView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return (
    <PersistedQueriesView
      api={{
        getCachedAdventures,
        inspectPersistedQuery,
        persistedQueryUrl,
        cacheTag: ADVENTURES_TAG,
        files: ["src/labs/11-aem-persisted-queries/data.ts", "src/labs/11-aem-persisted-queries/cached.ts"],
      }}
      difficulty={param(searchParams, "difficulty")}
    />
  );
}
