import { Suspense } from "react";
import { LabBoundary } from "./lab-boundary";
import { exerciseLoaders, solutionLoaders } from "@/lib/lab-components";
import type { LabViewProps } from "@/lib/lab-view";

async function LoadedView({
  slug,
  variant,
  searchParams,
}: {
  slug: string;
  variant: "exercise" | "solution";
  searchParams: Promise<LabViewProps["searchParams"]>;
}) {
  const loader = (variant === "exercise" ? exerciseLoaders : solutionLoaders)[slug];
  const [{ default: View }, resolvedSearchParams] = await Promise.all([loader(), searchParams]);
  return <View searchParams={resolvedSearchParams} />;
}

export function LiveLab(props: {
  slug: string;
  variant: "exercise" | "solution";
  files: string[];
  searchParams: Promise<LabViewProps["searchParams"]>;
}) {
  return (
    <LabBoundary files={props.files}>
      <Suspense
        fallback={
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line p-6 text-sm text-muted">
            <span className="size-2 animate-pulse rounded-full bg-accent" /> Rendering…
          </div>
        }
      >
        <LoadedView slug={props.slug} variant={props.variant} searchParams={props.searchParams} />
      </Suspense>
    </LabBoundary>
  );
}
