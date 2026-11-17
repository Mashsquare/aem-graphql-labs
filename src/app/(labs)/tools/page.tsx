import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";
import { readProjectFile } from "@/lib/lab-files";

export const metadata: Metadata = { title: "Client tooling guide" };

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">GraphQL client tooling</h1>
      <p className="mt-2 mb-8 text-muted">The most used packages for talking to GraphQL from TypeScript, and where each one fits in an AEM headless project.</p>
      <Markdown source={readProjectFile("docs/CLIENT-TOOLING.md") ?? ""} />
    </div>
  );
}
