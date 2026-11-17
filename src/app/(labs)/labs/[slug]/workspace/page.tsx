import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileList } from "@/components/file-list";
import { LiveLab } from "@/components/live-lab";
import { PageSkeleton } from "@/components/page-skeleton";
import { getLab } from "@/lib/labs";

export async function generateMetadata({ params }: PageProps<"/labs/[slug]/workspace">): Promise<Metadata> {
  const lab = getLab((await params).slug);
  return { title: lab ? `Workspace · ${lab.title}` : "Workspace" };
}

async function Workspace({ params, searchParams }: PageProps<"/labs/[slug]/workspace">) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();
  const ownRoutes = lab.routes?.filter((route) => !route.solution) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">
            Live render of <code className="font-mono text-xs">src/labs/{slug}/Exercise.tsx</code>
          </p>
          <p className="mt-1 text-muted">Edit these files and save — the page hot-reloads:</p>
          <div className="mt-2">
            <FileList module="labs" slug={slug} files={lab.files} />
          </div>
        </div>
        {lab.check ? (
          <div className="shrink-0">
            <p className="mb-1 text-xs text-muted">Automated checks</p>
            <code className="block rounded-md bg-surface-2 px-2 py-1.5 font-mono text-xs">{lab.check}</code>
          </div>
        ) : null}
      </div>
      {ownRoutes.length ? (
        <p className="text-sm">
          {ownRoutes.map((route) => (
            <a key={route.href} href={route.href} className="mr-4 text-accent hover:underline">
              {route.label} →
            </a>
          ))}
        </p>
      ) : null}
      <LiveLab slug={slug} variant="exercise" files={lab.files.map((file) => `src/labs/${slug}/${file}`)} searchParams={searchParams} />
    </div>
  );
}

export default function WorkspacePage(props: PageProps<"/labs/[slug]/workspace">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Workspace {...props} />
    </Suspense>
  );
}
