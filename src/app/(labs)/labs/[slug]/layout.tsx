import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LabTabs } from "@/components/lab-tabs";
import { getLab, labs, neighbours, parts } from "@/lib/labs";

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

type Params = LayoutProps<"/labs/[slug]">["params"];

async function LabHeader({ params }: { params: Params }) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();
  return (
    <>
      <p className="mb-2 font-mono text-xs tracking-wider text-muted uppercase">
        Lab {String(lab.number).padStart(2, "0")} · {parts[lab.part].title}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{lab.title}</h1>
      <p className="mt-2 max-w-3xl text-lg text-muted text-pretty">{lab.summary}</p>
      <div className="mt-4 mb-6 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-line px-2.5 py-1">{lab.api}</span>
        {lab.tools.map((tool) => (
          <span key={tool} className="rounded-full bg-surface-2 px-2.5 py-1 font-mono">
            {tool}
          </span>
        ))}
        <span className="rounded-full px-2.5 py-1 text-muted">~{lab.minutes} min</span>
      </div>
      <LabTabs slug={slug} />
    </>
  );
}

async function LabPager({ params }: { params: Params }) {
  const { previous, next } = neighbours((await params).slug);
  return (
    <nav className="mt-16 flex justify-between gap-4 border-t border-line pt-6 text-sm">
      {previous ? (
        <Link href={`/labs/${previous.slug}`} className="text-muted hover:text-fg">
          ← {String(previous.number).padStart(2, "0")} {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/labs/${next.slug}`} className="text-right text-muted hover:text-fg">
          {String(next.number).padStart(2, "0")} {next.title} →
        </Link>
      ) : null}
    </nav>
  );
}

export default function LabLayout({ children, params }: LayoutProps<"/labs/[slug]">) {
  // params are awaited inside Suspense boundaries so navigations between labs stay instant.
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<div className="h-48" />}>
        <LabHeader params={params} />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <LabPager params={params} />
      </Suspense>
    </div>
  );
}
