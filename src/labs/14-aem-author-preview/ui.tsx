/** Provided UI for Lab 14. */
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, EmptyState, Panel, buttonClass, formatPrice, primaryButtonClass } from "@/components/lab-ui";
import { aemConfig } from "@/lib/aem/config";
import { BrowserAuthorProbe } from "./BrowserAuthorProbe";
import type { PreviewAdventure } from "./types";

export interface PreviewApi {
  getAdventures: (preview: boolean) => Promise<PreviewAdventure[]>;
  getAdventureBySlug: (slug: string, preview: boolean) => Promise<PreviewAdventure | null>;
  /** e.g. /api/lab14/draft */
  draftRoute: string;
  /** where "Exit preview" returns to */
  returnTo: string;
}

const secret = () => process.env.PREVIEW_SECRET ?? "lab-preview-secret";

export async function PreviewView({ api, slug }: { api: PreviewApi; slug?: string }) {
  const { isEnabled } = await draftMode();
  const [visible, published] = await Promise.all([api.getAdventures(isEnabled), api.getAdventures(false)]);
  const publishedPaths = new Set(published.map((adventure) => adventure._path));
  const selected = slug ? await api.getAdventureBySlug(slug, isEnabled) : null;
  const returnTo = api.returnTo;

  async function exitPreview() {
    "use server";
    (await draftMode()).disable();
    redirect(returnTo);
  }

  return (
    <div className="space-y-6">
      {isEnabled ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
          <span>
            <b>Preview mode</b> — content comes from <b>AEM Author</b> ({aemConfig().authorHost}), caches are bypassed.
          </span>
          <form action={exitPreview}>
            <button className={buttonClass}>Exit preview</button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          Visitors see <b>Publish</b> ({aemConfig().publishHost}). Editors enter preview through the draft route, like AEM&apos;s &quot;Preview&quot; button would:{" "}
          <a className="text-accent hover:underline" href={`${api.draftRoute}?secret=${secret()}&slug=iceland-northern-lights-trek`}>
            preview the Iceland draft
          </a>{" "}
          · <a className="text-accent hover:underline" href={`${api.draftRoute}?secret=wrong&slug=iceland-northern-lights-trek`}>try a wrong secret</a>
        </div>
      )}

      {selected ? (
        <Panel title={selected.title} description={selected._path} actions={publishedPaths.has(selected._path) ? <Badge tone="ok">published</Badge> : <Badge tone="warn">draft — Author only</Badge>}>
          <p className="text-lg font-medium">{formatPrice(selected.price)}</p>
          <p className="mt-2 text-sm">{selected.description?.plaintext}</p>
        </Panel>
      ) : slug ? (
        <EmptyState>“{slug}” is not visible on this tier.</EmptyState>
      ) : null}

      <Panel
        title={`${visible.length} adventures on ${isEnabled ? "Author" : "Publish"}`}
        description={isEnabled ? "Drafts and unpublished edits included." : "Only replicated content."}
      >
        <ul className="divide-y divide-line text-sm">
          {visible.map((adventure) => (
            <li key={adventure._path} className="flex items-center justify-between py-2">
              <a href={`?slug=${adventure.slug}`} className="hover:text-accent">
                {adventure.title}
              </a>
              <span className="flex items-center gap-2">
                {publishedPaths.has(adventure._path) ? null : <Badge tone="warn">draft</Badge>}
                {formatPrice(adventure.price)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Change a title in the{" "}
          <a className="text-accent hover:underline" href={`${aemConfig().authorHost}/mock/console`} target="_blank" rel="noreferrer">
            authoring console
          </a>
          : it shows up here in preview immediately, and for visitors only after you publish it.
        </p>
      </Panel>

      <Panel title="Why not call Author from the browser?">
        <BrowserAuthorProbe authorUrl={`${aemConfig().authorHost}${aemConfig().endpoint}`} />
      </Panel>

      {!isEnabled ? (
        <a className={primaryButtonClass} href={`${api.draftRoute}?secret=${secret()}&slug=bali-surf-camp`}>
          Enter preview mode
        </a>
      ) : null}
    </div>
  );
}
