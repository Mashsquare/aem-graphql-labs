import { ApolloLabProvider } from "./ApolloLabProvider";
import { CacheInspector } from "./CacheInspector";
import { EpisodeExplorer } from "./EpisodeExplorer";

export default function Exercise() {
  return (
    <ApolloLabProvider>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <EpisodeExplorer />
        <CacheInspector />
      </div>
    </ApolloLabProvider>
  );
}
