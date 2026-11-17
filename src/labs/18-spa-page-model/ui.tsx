/** Provided UI for Lab 18 — the featured page rendered from its page model, in Publish or editor mode. */
import Link from "next/link";
import { Badge, JsonPeek, Panel } from "@/components/lab-ui";
import type { ModelNode, PageModel } from "@/lib/aem/page-model";
import { fetchPageModel } from "@/lib/aem/sites";
import { registerDemoComponents } from "./components";
import type { Mapping, ModelComponentProps } from "./types";

export interface SpaApi {
  createMapping: () => Mapping;
  ModelComponent: (props: ModelComponentProps) => React.ReactNode;
  findByPath: (root: ModelNode, cqPath: string) => ModelNode | undefined;
  applyUpdate: (root: ModelNode, cqPath: string, replacement: ModelNode) => ModelNode;
}

const PAGE = "/content/wknd/us/en/featured";

export async function SpaView({ api, editor }: { api: SpaApi; editor: boolean }) {
  const page = await fetchPageModel<PageModel>(PAGE);
  const mapping = registerDemoComponents(api.createMapping());
  const { ModelComponent } = api;

  const titlePath = `${PAGE}/jcr:content/root/container/title`;
  const cardsPath = `${PAGE}/jcr:content/root/container/cards`;
  const title = api.findByPath(page, titlePath);
  const edited = title ? api.applyUpdate(page, titlePath, { ...title, text: `${String(title.text)} (edited in the page editor)` }) : page;
  const shared = api.findByPath(edited, cardsPath) === api.findByPath(page, cardsPath);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Render as:</span>
        <Link href="?editor=0" className={`rounded-md border px-3 py-1 ${!editor ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
          Publish
        </Link>
        <Link href="?editor=1" className={`rounded-md border px-3 py-1 ${editor ? "border-accent bg-accent-soft text-accent" : "border-line"}`}>
          Page editor (isInEditor)
        </Link>
      </div>

      <Panel
        title={`${PAGE}.model.json -> React`}
        actions={<Badge tone={editor ? "warn" : "ok"}>{editor ? "editor: data-cq-data-path + placeholders" : "publish: clean markup"}</Badge>}
      >
        <div className="rounded-lg border border-line p-4 [&_[data-cq-data-path]]:outline [&_[data-cq-data-path]]:outline-1 [&_[data-cq-data-path]]:outline-dashed [&_[data-cq-data-path]]:outline-accent/40 [&_.cq-placeholder]:before:content-[attr(data-emptytext)] [&_.cq-placeholder]:grid [&_.cq-placeholder]:min-h-12 [&_.cq-placeholder]:place-items-center [&_.cq-placeholder]:bg-surface-2 [&_.cq-placeholder]:text-sm [&_.cq-placeholder]:text-muted [&_.aem-unmapped]:rounded [&_.aem-unmapped]:bg-red-500/10 [&_.aem-unmapped]:p-2 [&_.aem-unmapped]:text-sm">
          <ModelComponent model={page} mapping={mapping} isInEditor={editor} />
        </div>
        <JsonPeek label="page model" data={page} />
      </Panel>

      <Panel title="An editor update (Task 4)" description="The editor reports a changed Title. applyUpdate returns a new model; untouched branches keep their identity.">
        <div className="rounded-lg border border-line p-4">
          <ModelComponent model={edited} mapping={mapping} isInEditor={false} />
        </div>
        <p className="mt-3 text-sm">
          cards subtree reused: <Badge tone={shared ? "ok" : "danger"}>{String(shared)}</Badge> · original untouched:{" "}
          <Badge tone={api.findByPath(page, titlePath)?.text === title?.text ? "ok" : "danger"}>{String(api.findByPath(page, titlePath)?.text === title?.text)}</Badge>
        </p>
      </Panel>
    </div>
  );
}
