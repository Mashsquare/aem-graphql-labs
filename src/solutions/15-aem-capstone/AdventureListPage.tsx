import type { Metadata } from "next";
import { AdventureGrid } from "@/labs/15-aem-capstone/ui";
import { getAdventures } from "./data";

export const metadata: Metadata = { title: "Adventures · WKND", description: "Trips rendered from AEM Content Fragments." };

export const BASE_PATH = "/capstone-solution/adventures";

export default async function AdventureListPage() {
  // Cached ("use cache") -> part of the static shell, prerendered at build time.
  const adventures = await getAdventures();
  return <AdventureGrid adventures={adventures} basePath={BASE_PATH} />;
}
