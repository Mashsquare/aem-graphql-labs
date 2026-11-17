/** Provided — live self-check for the capstone, shown on the workspace tab. */
import { Badge, Panel } from "@/components/lab-ui";
import type { AdventureDetail, AdventureListItem, AemEvent } from "./types";

export interface CapstoneApi {
  fetchAdventures: () => Promise<AdventureListItem[]>;
  fetchAdventure: (slug: string) => Promise<AdventureDetail | null>;
  tagsForEvent: (event: AemEvent) => string[];
  siteBase: string;
  webhookPath: string;
}

async function check(label: string, run: () => Promise<string> | string) {
  try {
    return { label, ok: true, detail: await run() };
  } catch (error) {
    return { label, ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function CapstoneChecklist({ api }: { api: CapstoneApi }) {
  const results = await Promise.all([
    check("fetchAdventures() returns the 16 English adventures", async () => {
      const adventures = await api.fetchAdventures();
      if (adventures.length !== 16) throw new Error(`got ${adventures.length}`);
      return `first: ${adventures[0].title}`;
    }),
    check("fetchAdventure('bali-surf-camp') returns the adventure with its location", async () => {
      const detail = await api.fetchAdventure("bali-surf-camp");
      if (!detail?.adventure.location) throw new Error("no adventure/location");
      return `${detail.adventure.title} · ${detail.adventure.location.country} · ${detail.references.length} references`;
    }),
    check("fetchAdventure('does-not-exist') returns null", async () => {
      const detail = await api.fetchAdventure("does-not-exist");
      if (detail !== null) throw new Error("expected null");
      return "null";
    }),
    check("tagsForEvent() maps a published adventure to two tags", () => {
      const tags = api.tagsForEvent({ type: "aem.sites.contentFragment.published", data: { model: "adventure", slug: "tahoe-skiing" } });
      if (tags.length !== 2) throw new Error(`got ${JSON.stringify(tags)}`);
      return tags.join(", ");
    }),
  ]);

  return (
    <div className="space-y-6">
      <Panel title="Capstone self-check" description="Runs your data functions live against the mock AEM.">
        <ul className="space-y-2 text-sm">
          {results.map((result) => (
            <li key={result.label} className="flex items-start gap-3">
              <Badge tone={result.ok ? "ok" : "warn"}>{result.ok ? "✓" : "…"}</Badge>
              <span>
                {result.label}
                <span className="block font-mono text-xs text-muted">{result.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Try the full loop">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            Open your site: <a className="text-accent hover:underline" href={api.siteBase}>{api.siteBase}</a> and an adventure, e.g.{" "}
            <a className="text-accent hover:underline" href={`${api.siteBase}/tahoe-skiing`}>
              tahoe-skiing
            </a>
            .
          </li>
          <li>
            In the{" "}
            <a className="text-accent hover:underline" href="http://localhost:4502/mock/console" target="_blank" rel="noreferrer">
              authoring console
            </a>{" "}
            edit Tahoe Skiing&apos;s title and price, save — reload your page: nothing changes (Publish has the old version, and Next.js has it cached).
          </li>
          <li>
            Click <b>Publish</b>. The mock sends a webhook to <code>{api.webhookPath}</code> (watch the terminal). Reload: the new title is there.
          </li>
          <li>
            Unpublish Bali Surf Camp: it disappears from the list, and its page 404s after the webhook.
          </li>
        </ol>
      </Panel>
    </div>
  );
}
