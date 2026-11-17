/** Provided UI for Lab 19 — a page whose layout comes from AEM's page model and whose content comes from GraphQL. */
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, JsonPeek, Panel, formatPrice } from "@/components/lab-ui";
import { sanitizeRichText } from "@/lib/aem/sanitize";
import { ModelComponent, createMapping } from "@/lib/aem/spa";
import type { Adventure, AuthoredCard, CardViewModel, HybridPage } from "./types";

export interface HybridApi {
  loadHybridPage: (pagePath: string) => Promise<HybridPage>;
  mergeCardProps: (authored: AuthoredCard, fragment: Adventure | null | undefined) => CardViewModel | null;
}

const PAGE = "/content/wknd/us/en/featured";

function Card({ vm }: { vm: CardViewModel }) {
  return (
    <a href={vm.href} className={`group block overflow-hidden rounded-lg border border-line bg-surface ${vm.layout === "compact" ? "flex items-center gap-3" : ""}`}>
      {vm.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vm.image.src} alt="" className={vm.layout === "compact" ? "size-20 object-cover" : "aspect-[3/2] w-full object-cover"} />
      ) : null}
      <div className="p-3">
        <p className="font-medium group-hover:text-accent">{vm.title}</p>
        <p className="text-sm text-muted">{vm.meta}</p>
        {vm.price !== null ? <p className="mt-1 text-sm font-medium">{formatPrice(vm.price)}</p> : null}
      </div>
    </a>
  );
}

export async function HybridPageView({ api, editor }: { api: HybridApi; editor: boolean }) {
  const { model, adventures } = await api.loadHybridPage(PAGE);

  const mapping = createMapping();
  mapping.MapTo("wknd/components/title")(({ text, type = "h2" }: { text?: string; type?: "h1" | "h2" }) => {
    const Tag = type;
    return <Tag className="text-2xl font-semibold tracking-tight">{text}</Tag>;
  });
  mapping.MapTo("wknd/components/text")(({ text = "", richText }: { text?: string; richText?: boolean }) =>
    richText ? <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(text) }} /> : <p className="text-muted">{text}</p>,
  );
  mapping.MapTo("wknd/components/adventurecard")(
    ({ fragmentPath, showPrice, layout, isInEditor }: AuthoredCard & { isInEditor?: boolean }): ReactNode => {
      const vm = api.mergeCardProps({ fragmentPath, showPrice, layout }, fragmentPath ? adventures.get(fragmentPath) : undefined);
      if (vm) return <Card vm={vm} />;
      // The card is configured, but AEM did not return the fragment: a draft on Publish, a deleted or mistyped path.
      return isInEditor ? <p className="rounded bg-amber-500/15 p-2 text-sm text-amber-700 dark:text-amber-300">Fragment not available on Publish: {fragmentPath}</p> : null;
    },
    { emptyLabel: "Adventure card", isEmpty: (props: AuthoredCard) => !props.fragmentPath },
  );

  const resolved = [...adventures.values()].filter(Boolean).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="?editor=0" className={`rounded-md border px-3 py-1 ${!editor ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
          Publish
        </Link>
        <Link href="?editor=1" className={`rounded-md border px-3 py-1 ${editor ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
          Page editor
        </Link>
        <Badge tone="ok">{adventures.size} fragment paths in the page</Badge>
        <Badge tone={resolved === adventures.size ? "ok" : "warn"}>{resolved} resolved on Publish</Badge>
      </div>
      <Panel title={`${PAGE}: layout from the page model, content from GraphQL`}>
        <div className="[&_.aem-Grid]:grid [&_.aem-Grid]:gap-4 [&_.aem-GridColumn--default--6]:col-span-1 [&_[data-cq-data-path]]:outline [&_[data-cq-data-path]]:outline-1 [&_[data-cq-data-path]]:outline-dashed [&_[data-cq-data-path]]:outline-accent/40 [&_.cq-placeholder]:before:content-[attr(data-emptytext)] [&_.cq-placeholder]:grid [&_.cq-placeholder]:min-h-12 [&_.cq-placeholder]:place-items-center [&_.cq-placeholder]:bg-surface-2 [&_.cq-placeholder]:text-sm [&_.cq-placeholder]:text-muted [&_.aem-unmapped]:rounded [&_.aem-unmapped]:bg-red-500/10 [&_.aem-unmapped]:p-2 [&_.aem-unmapped]:text-sm">
          <ModelComponent model={model} mapping={mapping} isInEditor={editor} />
        </div>
        <JsonPeek label="what the page model carries for the cards (no content!)" data={[...adventures.keys()]} />
      </Panel>
    </div>
  );
}
