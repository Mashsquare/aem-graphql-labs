import type { Metadata } from "next";
import { CapstoneTodo } from "./ui";

/**
 * Task 5 — the detail page, served at /capstone/adventures/[slug].
 *
 *  generateStaticParams  -> one { slug } per adventure from getAdventures()
 *                           (with Cache Components it must return at least one entry)
 *  generateMetadata      -> title + description from getAdventure(slug); "Adventure not found" otherwise
 *  default export        -> render <Suspense fallback={<DetailSkeleton />}><Content params={params} /></Suspense>
 *                           where Content awaits params, calls getAdventure(slug), calls notFound() for null
 *                           and renders <AdventureDetailView detail={detail} basePath={BASE_PATH} />
 */
const BASE_PATH = "/capstone/adventures";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // TODO: return (await getAdventures()).flatMap(...)
  return [{ slug: "bali-surf-camp" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  void params;
  return { title: "TODO: adventure title" };
}

export default async function AdventureDetailPage({ params }: Props) {
  void params;
  void BASE_PATH;
  return <CapstoneTodo task="Task 5: render the adventure detail page" file="src/labs/15-aem-capstone/AdventureDetailPage.tsx" />;
}
