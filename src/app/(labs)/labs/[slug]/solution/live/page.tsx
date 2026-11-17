import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveLab } from "@/components/live-lab";
import { PageSkeleton } from "@/components/page-skeleton";
import { getLab } from "@/lib/labs";

export async function generateMetadata({ params }: PageProps<"/labs/[slug]/solution/live">): Promise<Metadata> {
  const lab = getLab((await params).slug);
  return { title: lab ? `Solution (live) · ${lab.title}` : "Solution" };
}

async function SolutionLive({ params, searchParams }: PageProps<"/labs/[slug]/solution/live">) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-line bg-surface p-4 text-sm">
        Live render of <code className="font-mono text-xs">src/solutions/{slug}/Solution.tsx</code> — the target your workspace should match.
        {lab.routes
          ?.filter((route) => route.solution)
          .map((route) => (
            <a key={route.href} href={route.href} className="ml-3 text-accent hover:underline">
              {route.label} →
            </a>
          ))}
      </p>
      <LiveLab slug={slug} variant="solution" files={lab.solutionFiles.map((file) => `src/solutions/${slug}/${file}`)} searchParams={searchParams} />
    </div>
  );
}

export default function SolutionLivePage(props: PageProps<"/labs/[slug]/solution/live">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SolutionLive {...props} />
    </Suspense>
  );
}
