import type { Metadata } from "next";
import path from "node:path";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CodeBlock } from "@/components/code-block";
import { Markdown } from "@/components/markdown";
import { PageSkeleton } from "@/components/page-skeleton";
import { languageFromFile } from "@/lib/highlight";
import { readLabFile } from "@/lib/lab-files";
import { getLab } from "@/lib/labs";

export async function generateMetadata({ params }: PageProps<"/labs/[slug]/solution">): Promise<Metadata> {
  const lab = getLab((await params).slug);
  return { title: lab ? `Solution · ${lab.title}` : "Solution" };
}

async function SolutionWalkthrough({ params }: Pick<PageProps<"/labs/[slug]/solution">, "params">) {
  const { slug } = await params;
  const lab = getLab(slug);
  const walkthrough = readLabFile("solutions", slug, "SOLUTION.md");
  if (!lab || walkthrough === null) notFound();

  return (
    <div className="space-y-10">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
        Spoilers ahead. Try the workspace first — then compare. The reference code lives in{" "}
        <code className="font-mono text-xs">src/solutions/{slug}/</code>.
      </div>
      <Markdown source={walkthrough} baseDir={path.join(/*turbopackIgnore: true*/ process.cwd(), "src", "solutions", slug)} />
      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Reference implementation</h2>
        {lab.solutionFiles.map((file) => {
          const code = readLabFile("solutions", slug, file);
          return code === null ? null : <CodeBlock key={file} code={code} language={languageFromFile(file)} title={`src/solutions/${slug}/${file}`} />;
        })}
      </section>
    </div>
  );
}

export default function SolutionPage({ params }: PageProps<"/labs/[slug]/solution">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SolutionWalkthrough params={params} />
    </Suspense>
  );
}
