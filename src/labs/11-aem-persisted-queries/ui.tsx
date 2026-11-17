/** Provided UI for Lab 11 (Server Components + one Server Action). */
import Link from "next/link";
import { updateTag } from "next/cache";
import { Suspense } from "react";
import { LabBoundary } from "@/components/lab-boundary";
import { Badge, Panel, buttonClass, formatPrice } from "@/components/lab-ui";
import { aemConfig } from "@/lib/aem/config";
import { authorAuthorizationHeader } from "@/lib/aem/server";
import { CONFIGURATION, LAB_QUERIES, type LabAdventure } from "./queries";
import type { CacheInspection } from "./data";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

export interface PersistedQueriesApi {
  getCachedAdventures: (difficulty: string) => Promise<{ items: LabAdventure[]; fetchedAt: string }>;
  inspectPersistedQuery: (shortPath: string, variables?: Record<string, unknown>) => Promise<CacheInspection>;
  persistedQueryUrl: (shortPath: string, variables?: Record<string, unknown>) => string;
  cacheTag: string;
  files: string[];
}

async function listNames(tier: "author" | "publish"): Promise<Set<string> | null> {
  const { authorHost, publishHost } = aemConfig();
  try {
    const response = await fetch(`${tier === "author" ? authorHost : publishHost}/graphql/list.json`, {
      headers: tier === "author" ? { Authorization: authorAuthorizationHeader() } : {},
      cache: "no-store",
    });
    const list = (await response.json()) as { path: { shortPath: string } }[];
    return new Set(list.map((entry) => entry.path.shortPath));
  } catch {
    return null;
  }
}

async function StatusPanel() {
  const [author, publish] = await Promise.all([listNames("author"), listNames("publish")]);
  const mark = (set: Set<string> | null, name: string) =>
    set === null ? <Badge tone="danger">AEM unreachable</Badge> : set.has(`/${CONFIGURATION}/${name}`) ? <Badge tone="ok">✓ exists</Badge> : <Badge>✗ missing</Badge>;
  return (
    <Panel title="1 · Persisted query status" description="Read from /graphql/list.json on both tiers (no cache).">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="py-1">Query</th>
            <th>Author</th>
            <th>Publish</th>
          </tr>
        </thead>
        <tbody>
          {LAB_QUERIES.map((query) => (
            <tr key={query.name} className="border-t border-line">
              <td className="py-2 font-mono text-xs">
                {CONFIGURATION}/{query.name}
              </td>
              <td>{mark(author, query.name)}</td>
              <td>{mark(publish, query.name)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-muted">
        Persist + publish them with <code className="rounded bg-surface-2 px-1">npm run lab11:persist</code>, then reload. Missing on Publish but present on Author? You
        persisted but didn&apos;t replicate.
      </p>
    </Panel>
  );
}

async function ResultsPanel({ api, difficulty }: { api: PersistedQueriesApi; difficulty: string }) {
  // The SDK's error for a missing persisted query is just "{ errors: [Array] }" — check first.
  const published = await listNames("publish");
  if (published && !published.has(`/${CONFIGURATION}/lab-adventures-by-difficulty`)) {
    return (
      <Panel title={`2 · ${difficulty} adventures (cached in Next.js)`}>
        <p className="text-sm text-muted">
          <code>{CONFIGURATION}/lab-adventures-by-difficulty</code> is not on Publish yet, so there is nothing to run. Persist and publish it first (task 2):{" "}
          <code className="rounded bg-surface-2 px-1">npm run lab11:persist</code>
        </p>
      </Panel>
    );
  }
  const { items, fetchedAt } = await api.getCachedAdventures(difficulty);
  const tag = api.cacheTag;
  async function expireCache() {
    "use server";
    // Server Actions can expire a tag immediately (read-your-own-writes).
    updateTag(tag);
  }
  return (
    <Panel
      title={`2 · ${difficulty} adventures (cached in Next.js)`}
      description={`fetched at ${new Date(fetchedAt).toLocaleTimeString("en-GB")} · reload: the time only changes when the cache entry is regenerated`}
      actions={
        <form action={expireCache}>
          <button className={buttonClass}>Expire tag “{tag}”</button>
        </form>
      }
    >
      <ul className="divide-y divide-line text-sm">
        {items.map((item) => (
          <li key={item._path} className="flex justify-between py-2">
            <span>
              {item.title} <span className="text-muted">· {item.activity}</span>
            </span>
            <span>{formatPrice(item.price)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

async function HeadersPanel({ api, difficulty }: { api: PersistedQueriesApi; difficulty: string }) {
  const rows = await Promise.all([
    api.inspectPersistedQuery(`${CONFIGURATION}/lab-adventures-by-difficulty`, { difficulty }),
    api.inspectPersistedQuery(`${CONFIGURATION}/adventures-all`),
  ]);
  return (
    <Panel title="3 · What AEM tells caches" description="Raw GET of the persisted query on Publish.">
      <div className="space-y-4">
        {rows.map((row) => (
          <dl key={row.url} className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted">URL</dt>
            <dd className="font-mono text-xs break-all">{row.url}</dd>
            <dt className="text-muted">Status</dt>
            <dd>{row.status}</dd>
            <dt className="text-muted">Cache-Control</dt>
            <dd className="font-mono text-xs">{row.cacheControl ?? "—"}</dd>
            <dt className="text-muted">Surrogate-Control</dt>
            <dd className="font-mono text-xs">{row.surrogateControl ?? "—"}</dd>
          </dl>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Your URL builder: <code className="break-all">{api.persistedQueryUrl(`${CONFIGURATION}/lab-adventures-by-difficulty`, { difficulty, note: "a;b=c" })}</code>
      </p>
    </Panel>
  );
}

const loading = <div className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">Loading…</div>;

export function PersistedQueriesView({ api, difficulty = "Beginner" }: { api: PersistedQueriesApi; difficulty?: string }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={loading}>
        <StatusPanel />
      </Suspense>
      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((value) => (
          <Link key={value} href={`?difficulty=${value}`} className={`${buttonClass} ${value === difficulty ? "border-accent text-accent" : ""}`}>
            {value}
          </Link>
        ))}
      </div>
      <LabBoundary files={api.files}>
        <Suspense fallback={loading}>
          <ResultsPanel api={api} difficulty={difficulty} />
        </Suspense>
      </LabBoundary>
      <LabBoundary files={api.files}>
        <Suspense fallback={loading}>
          <HeadersPanel api={api} difficulty={difficulty} />
        </Suspense>
      </LabBoundary>
    </div>
  );
}
