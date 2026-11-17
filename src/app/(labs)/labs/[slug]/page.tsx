import type { Metadata } from "next";
import Link from "next/link";
import path from "node:path";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileList } from "@/components/file-list";
import { Markdown } from "@/components/markdown";
import { PageSkeleton } from "@/components/page-skeleton";
import { readLabFile } from "@/lib/lab-files";
import { getLab } from "@/lib/labs";

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const lab = getLab((await params).slug);
  return { title: lab ? `${String(lab.number).padStart(2, "0")} ${lab.title}` : "Lab" };
}

async function LabBrief({ params }: Pick<PageProps<"/labs/[slug]">, "params">) {
  const { slug } = await params;
  const lab = getLab(slug);
  const prompt = readLabFile("labs", slug, "PROMPT.md");
  if (!lab || prompt === null) notFound();

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0">
        <Markdown source={prompt} baseDir={path.join(/*turbopackIgnore: true*/ process.cwd(), "src", "labs", slug)} />
      </article>
      <aside className="space-y-6 text-sm xl:sticky xl:top-20 xl:self-start">
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Files you edit</h2>
          <FileList module="labs" slug={slug} files={lab.files} />
        </section>
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Concepts</h2>
          <ul className="flex flex-wrap gap-1.5">
            {lab.concepts.map((concept) => (
              <li key={concept} className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">
                {concept}
              </li>
            ))}
          </ul>
        </section>
        {lab.check ? (
          <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Check your work</h2>
            <code className="block rounded-md bg-surface-2 px-2 py-1.5 font-mono text-xs">{lab.check}</code>
          </section>
        ) : null}
        <Link href={`/labs/${slug}/workspace`} prefetch={false} className="block rounded-lg bg-accent px-4 py-2.5 text-center font-medium text-white hover:opacity-90">
          Open your workspace →
        </Link>
      </aside>
    </div>
  );
}

export default function LabBriefPage({ params }: PageProps<"/labs/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LabBrief params={params} />
    </Suspense>
  );
}
