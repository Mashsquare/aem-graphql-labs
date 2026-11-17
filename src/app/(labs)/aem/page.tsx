import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";
import { readProjectFile } from "@/lib/lab-files";
import { models, typeNameFor } from "@mock-aem/src/models";
import { outputType } from "@mock-aem/src/schema";

export const metadata: Metadata = { title: "AEM GraphQL cheat sheet" };

export default function AemCheatSheetPage() {
  const source = readProjectFile("docs/AEM-GRAPHQL-CHEATSHEET.md") ?? "";
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">AEM GraphQL cheat sheet</h1>
      <p className="mt-2 mb-8 text-muted">The Content Fragment GraphQL API on one page — everything the labs use, with links to try it on the mock.</p>
      <Markdown source={source} />

      <h2 className="mt-12 mb-2 border-t border-line pt-6 text-2xl font-semibold tracking-tight">The models in this mock</h2>
      <p className="mb-6 text-sm text-muted">
        Generated from <code>mock-aem/src/models.ts</code> — the same definitions produce the GraphQL schema.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <section key={model.name} className="rounded-xl border border-line bg-surface p-4">
            <h3 className="font-medium">
              {model.title} <code className="ml-1 text-xs text-muted">{typeNameFor(model.name)}</code>
            </h3>
            <p className="mb-3 text-sm text-muted">{model.description}</p>
            <table className="w-full text-xs">
              <tbody>
                {model.fields.map((field) => (
                  <tr key={field.name} className="border-t border-line">
                    <td className="py-1 font-mono">{field.name}</td>
                    <td className="py-1 text-muted">{field.type}</td>
                    <td className="py-1 text-right font-mono">{outputType(field)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
