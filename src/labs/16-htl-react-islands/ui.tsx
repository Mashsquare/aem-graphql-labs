/** Provided UI for Lab 16 — shows the HTML AEM sent, and the React islands your code mounted on it. */
import type { ComponentType, ReactNode } from "react";
import { Badge, EmptyState, JsonPeek, Panel } from "@/components/lab-ui";
import { fetchPageHtml } from "@/lib/aem/sites";
import { parseMountPoints } from "./html";
import type { MountedIsland, MountFn, ErrorHandler, IslandHost, Registry } from "./types";

export interface IslandsApi {
  mountIslands: (host: IslandHost, registry: Registry, mount: MountFn, onError?: ErrorHandler) => MountedIsland[];
  PriceTag: ComponentType<{ amount?: number; currency?: string; sale?: boolean; label?: string }>;
  safeHref: (value: unknown) => string | undefined;
}

function AdventureCard({ title, activity, price, difficulty, detailsUrl, tags, safeHref }: Record<string, unknown> & { safeHref: IslandsApi["safeHref"] }) {
  const href = safeHref(detailsUrl);
  const heading = <span className="font-medium">{String(title)}</span>;
  return (
    <div className="rounded-lg border border-line p-3 text-sm">
      {href ? (
        <a href={href} className="text-accent hover:underline">
          {heading}
        </a>
      ) : (
        heading
      )}
      <p className="text-muted">
        {String(activity)} · {String(difficulty)} · ${String(price)}
      </p>
      {Array.isArray(tags) && tags.length ? <p className="mt-1 text-xs text-muted">{tags.join(" · ")}</p> : null}
      {!href && detailsUrl ? <p className="mt-1 text-xs text-red-600">link blocked: {JSON.stringify(detailsUrl)}</p> : null}
    </div>
  );
}

function Departure({ label, date, showWeekday }: { label?: string; date?: string; showWeekday?: boolean }) {
  const text = date
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC", ...(showWeekday ? { weekday: "long" as const } : {}) }).format(new Date(`${date}T00:00:00Z`))
    : "—";
  return (
    <p className="rounded-lg border border-line p-3 text-sm">
      {label}: <strong>{text}</strong>
    </p>
  );
}

export async function IslandsView({ api, page }: { api: IslandsApi; page: string }) {
  const html = await fetchPageHtml(page);
  const document = parseMountPoints(html);

  const rendered: { node: ReactNode }[] = [];
  const errors: string[] = [];
  const registry: Registry = {
    PriceTag: api.PriceTag,
    AdventureCard: (props: Record<string, unknown>) => <AdventureCard {...props} safeHref={api.safeHref} />,
    Departure,
  };
  const islands = api.mountIslands(
    document,
    registry,
    (_element, node) => {
      rendered.push({ node });
      return { unmount() {} };
    },
    (error) => errors.push(error.message),
  );

  return (
    <div className="space-y-6">
      <Panel
        title={`What AEM sent: ${page}.html`}
        description="HTL rendered this on the server. Every element with data-react-component is a place where React should take over."
      >
        <div className="space-y-2">
          {document.elements.map((element, index) => (
            <pre key={index} className="overflow-x-auto rounded-md bg-surface-2 p-2 font-mono text-xs whitespace-pre-wrap break-all">
              {element.source}
            </pre>
          ))}
        </div>
      </Panel>

      <Panel
        title="What your code mounted"
        actions={
          <>
            <Badge tone="ok">{islands.length} mounted</Badge>
            {errors.length ? <Badge tone="danger">{errors.length} errors</Badge> : null}
          </>
        }
      >
        {islands.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {islands.map((island, index) => (
              <div key={index} className="rounded-xl border border-line p-3">
                <p className="mb-2 font-mono text-xs text-muted">&lt;{island.name} /&gt;</p>
                {rendered[index]?.node}
                <JsonPeek label="props your readProps produced" data={island.props} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Nothing mounted yet.</EmptyState>
        )}
        {errors.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}
