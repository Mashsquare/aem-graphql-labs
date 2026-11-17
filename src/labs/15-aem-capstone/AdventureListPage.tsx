import type { Metadata } from "next";
import { CapstoneTodo } from "./ui";

/**
 * Task 4 — the listing page, served at /capstone/adventures (see src/app/(sites)/capstone/).
 *
 *   const adventures = await getAdventures();
 *   return <AdventureGrid adventures={adventures} basePath={BASE_PATH} />;
 *
 * Because getAdventures() is cached ("use cache"), Next.js can prerender this page at build time
 * and serve it statically until the cache tag is revalidated.
 */
export const metadata: Metadata = { title: "Adventures · WKND", description: "Trips rendered from AEM Content Fragments." };

export const BASE_PATH = "/capstone/adventures";

export default async function AdventureListPage() {
  return <CapstoneTodo task="Task 4: render the adventure grid" file="src/labs/15-aem-capstone/AdventureListPage.tsx" />;
}
