/** Provided — the React components of the demo SPA, registered with YOUR createMapping. */
import { Badge } from "@/components/lab-ui";
import { sanitizeRichText } from "@/lib/aem/sanitize";
import type { Mapping } from "./types";

function Title({ text, type = "h2" }: { text?: string; type?: "h1" | "h2" | "h3" }) {
  const Tag = type;
  return <Tag className="text-2xl font-semibold tracking-tight">{text}</Tag>;
}

function Text({ text = "", richText }: { text?: string; richText?: boolean }) {
  return richText ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeRichText(text) }} /> : <p className="text-muted">{text}</p>;
}

/** Lab 19 turns this into a real card; here it only shows what the page model hands the component. */
function AdventureCard({ fragmentPath, showPrice, layout }: { fragmentPath?: string; showPrice?: boolean; layout?: string }) {
  return (
    <div className="rounded-lg border border-line p-3 text-sm">
      <p className="font-mono text-xs break-all">{fragmentPath}</p>
      <p className="mt-1 flex gap-2">
        <Badge>{layout ?? "full"}</Badge>
        {showPrice ? <Badge tone="accent">price shown</Badge> : null}
      </p>
    </div>
  );
}

export function registerDemoComponents(mapping: Mapping) {
  mapping.MapTo("wknd/components/title")(Title, { emptyLabel: "Title", isEmpty: (props: { text?: string }) => !props.text?.trim() });
  mapping.MapTo("wknd/components/text")(Text, { emptyLabel: "Text", isEmpty: (props: { text?: string }) => !props.text?.trim() });
  mapping.MapTo(["wknd/components/adventurecard"])(AdventureCard, { emptyLabel: "Adventure card", isEmpty: (props: { fragmentPath?: string }) => !props.fragmentPath });
  return mapping;
}
