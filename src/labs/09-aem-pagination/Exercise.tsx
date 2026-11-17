import { param, type LabViewProps } from "@/lib/lab-view";
import { InfiniteAdventuresApp } from "./InfiniteAdventures";
import { ADVENTURE_PAGE_QUERY, getAdventurePage } from "./offset";
import { OffsetPager } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OffsetPager getPage={getAdventurePage} page={Math.max(1, Number(param(searchParams, "page") ?? 1) || 1)} query={ADVENTURE_PAGE_QUERY} />
      <InfiniteAdventuresApp />
    </div>
  );
}
