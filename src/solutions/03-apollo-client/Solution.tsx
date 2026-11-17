import { CacheInspector } from "@/labs/03-apollo-client/CacheInspector";
import { ApolloLabProvider } from "./ApolloLabProvider";
import { EpisodeExplorer } from "./EpisodeExplorer";

export default function Solution() {
  return (
    <ApolloLabProvider>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <EpisodeExplorer />
        <CacheInspector />
      </div>
    </ApolloLabProvider>
  );
}
