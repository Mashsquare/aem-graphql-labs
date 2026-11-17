import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";
import { readProjectFile } from "@/lib/lab-files";

export const metadata: Metadata = { title: "Classic AEM cheat sheet" };

export default function ClassicCheatSheetPage() {
  const source = readProjectFile("docs/AEM-CLASSIC-CHEATSHEET.md") ?? "";
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Classic AEM cheat sheet</h1>
      <p className="mt-2 mb-8 text-muted">HTL, Sling Models, model.json and the page model on one page — the reference for Labs 16–19.</p>
      <Markdown source={source} />
    </div>
  );
}
