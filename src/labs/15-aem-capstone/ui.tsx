/** Provided UI for the capstone "WKND" site — you don't need to edit this file. */
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, formatPrice } from "@/components/lab-ui";
import { AemImage } from "@/lib/aem/aem-image";
import { AemRichText } from "@/lib/aem/rich-text";
import type { RichTextNode } from "@/lib/aem/types";
import type { AdventureDetail, AdventureListItem } from "./types";

type ImageLike = { _dynamicUrl?: string | null; width?: number | null; height?: number | null } | null | undefined;

/** Content references are a union; only ImageRef has _dynamicUrl. */
export function asImage(reference: unknown): { _dynamicUrl: string; width: number; height: number } | null {
  const image = reference as ImageLike;
  return image?._dynamicUrl && image.width && image.height ? { _dynamicUrl: image._dynamicUrl, width: image.width, height: image.height } : null;
}

export function excerptFromHtml(html: string | null | undefined, length = 155): string {
  const text = (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function WkndShell({ children, basePath, label }: { children: ReactNode; basePath: string; label: string }) {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
          <Link href={basePath} className="text-2xl font-black tracking-tighter">
            WKND<span className="text-amber-500">.</span>
          </Link>
          <nav className="text-sm font-medium">
            <Link href={basePath} className="hover:text-amber-600">
              Adventures
            </Link>
          </nav>
          <span className="ml-auto rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">{label}</span>
          <Link href="/labs/15-aem-capstone" className="text-xs text-zinc-500 hover:underline">
            ← back to the lab
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-zinc-500">
        Content: AEM Publish (mock) via persisted queries · cached with &quot;use cache&quot; · revalidated by AEM publish webhooks
      </footer>
    </div>
  );
}

export function AdventureGrid({ adventures, basePath }: { adventures: AdventureListItem[]; basePath: string }) {
  return (
    <>
      <h1 className="mb-2 text-4xl font-black tracking-tight">Adventures</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">{adventures.length} trips, rendered from AEM Content Fragments.</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adventures.map((adventure, index) => {
          const image = asImage(adventure.primaryImage);
          return (
            <Link key={adventure._path} href={`${basePath}/${adventure.slug}`} className="group block">
              <div className="overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800">
                {image ? (
                  <AemImage image={image} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" preload={index < 3} className="aspect-[3/2] h-auto w-full object-cover transition-transform group-hover:scale-105" />
                ) : null}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold group-hover:text-amber-600">{adventure.title}</h2>
                  <p className="text-sm text-zinc-500">
                    {adventure.activity} · {adventure.tripLength} · {adventure.difficulty}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatPrice(adventure.price)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function AdventureDetailView({ detail, basePath }: { detail: AdventureDetail; basePath: string }) {
  const { adventure, references } = detail;
  const image = asImage(adventure.primaryImage);
  const section = (title: string, nodes: unknown) =>
    Array.isArray(nodes) && nodes.length ? (
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">{title}</h2>
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          <AemRichText nodes={nodes as RichTextNode[]} references={references.filter((reference) => reference !== null)} />
        </div>
      </section>
    ) : null;

  return (
    <article>
      <Link href={basePath} className="text-sm text-zinc-500 hover:underline">
        ← All adventures
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="overflow-hidden rounded-3xl bg-zinc-200 dark:bg-zinc-800">
          {image ? <AemImage image={image} alt={adventure.title ?? ""} sizes="(min-width: 1024px) 60vw, 100vw" preload className="h-auto w-full" /> : null}
        </div>
        <div>
          <p className="flex flex-wrap gap-2">
            <Badge tone="accent">{adventure.activity}</Badge>
            <Badge>{adventure.adventureType}</Badge>
            {adventure._variation && adventure._variation !== "master" ? <Badge tone="warn">{adventure._variation}</Badge> : null}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{adventure.title}</h1>
          <p className="mt-2 text-2xl font-semibold">{formatPrice(adventure.price)}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {[
              ["Trip length", adventure.tripLength],
              ["Difficulty", adventure.difficulty],
              ["Group size", adventure.groupSize],
              ["Next departure", adventure.departureDate],
              ["Location", adventure.location ? `${adventure.location.name}, ${adventure.location.country}` : "—"],
              ["Region", adventure.location?.region],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-medium">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {section("About this trip", adventure.description?.json)}
      {section("Itinerary", adventure.itinerary?.json)}
      {section("What to bring", adventure.gearList?.json)}
    </article>
  );
}

export function DetailSkeleton() {
  return <div className="h-96 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />;
}

export function CapstoneTodo({ task, file }: { task: string; file: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-400 p-8">
      <p className="text-sm font-semibold tracking-wider text-amber-600 uppercase">Not built yet</p>
      <p className="mt-2 text-xl font-bold">{task}</p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Edit <code>{file}</code>. See the lab brief at <Link className="underline" href="/labs/15-aem-capstone">/labs/15-aem-capstone</Link>.
      </p>
    </div>
  );
}
