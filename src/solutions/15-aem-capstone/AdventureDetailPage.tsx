import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdventureDetailView, DetailSkeleton, excerptFromHtml } from "@/labs/15-aem-capstone/ui";
import { getAdventure, getAdventures } from "./data";

const BASE_PATH = "/capstone-solution/adventures";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Prerender every published adventure at build time; new ones render on first visit.
  const params = (await getAdventures()).flatMap((adventure) => (adventure.slug ? [{ slug: adventure.slug }] : []));
  // Cache Components requires at least one entry.
  return params.length ? params : [{ slug: "bali-surf-camp" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getAdventure((await params).slug);
  if (!detail) return { title: "Adventure not found" };
  return {
    title: `${detail.adventure.title} · WKND`,
    description: excerptFromHtml(detail.adventure.description?.html),
  };
}

async function AdventureContent({ params }: Props) {
  const { slug } = await params;
  const detail = await getAdventure(slug);
  if (!detail) notFound();
  return <AdventureDetailView detail={detail} basePath={BASE_PATH} />;
}

export default function AdventureDetailPage({ params }: Props) {
  // Awaiting params inside Suspense lets Next.js serve an instant shell for slugs it didn't prerender.
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AdventureContent params={params} />
    </Suspense>
  );
}
