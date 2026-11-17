"use client";

import { NetworkStatus } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { skipToken, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Badge, EmptyState, Field, Panel, inputClass, primaryButtonClass } from "@/components/lab-ui";
import { EPISODES_QUERY, EPISODE_QUERY } from "./queries";

export function EpisodeExplorer() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, previousData, loading, error, networkStatus, fetchMore } = useQuery(EPISODES_QUERY, {
    variables: { page: 1, filter: { name: search } },
    notifyOnNetworkStatusChange: true,
  });

  const page = (data ?? previousData)?.episodes;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const loadMore = () => {
    if (!page?.info.next) return;
    // Same query, next page — the `episodes` merge function appends the results.
    void fetchMore({ variables: { page: page.info.next } });
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Episodes"
        description={page ? `${page.results.length} of ${page.info.count ?? "?"} loaded` : "Loading…"}
        actions={loading ? <Badge tone="warn">network: {NetworkStatus[networkStatus]}</Badge> : <Badge tone="ok">idle</Badge>}
      >
        <Field label="Filter by name">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="rick" className={inputClass} />
        </Field>

        {error ? <ErrorMessage error={error} /> : null}

        {page?.results.length ? (
          <ul className="mt-4 divide-y divide-line">
            {page.results.map((episode) => (
              <li key={episode.id}>
                <button
                  onClick={() => setSelectedId(episode.id)}
                  className={`flex w-full items-center justify-between px-2 py-2 text-left text-sm hover:bg-surface-2 ${selectedId === episode.id ? "bg-accent-soft" : ""}`}
                >
                  <span>
                    <span className="mr-2 font-mono text-xs text-muted">{episode.episode}</span>
                    {episode.name}
                  </span>
                  <span className="text-xs text-muted">{episode.air_date}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : loading ? null : (
          <EmptyState>No episodes match “{search}”.</EmptyState>
        )}

        {page?.info.next ? (
          <button onClick={loadMore} disabled={loadingMore} className={`${primaryButtonClass} mt-4`}>
            {loadingMore ? "Loading…" : `Load more (page ${page.info.next})`}
          </button>
        ) : null}
      </Panel>

      <EpisodeDetails id={selectedId} />
    </div>
  );
}

function EpisodeDetails({ id }: { id: string | null }) {
  // skipToken = "don't run this query yet" — and keeps `variables` correctly typed.
  const { data, loading, error } = useQuery(EPISODE_QUERY, id ? { variables: { id } } : skipToken);

  if (!id) return <EmptyState>Select an episode to load its characters.</EmptyState>;
  if (error) return <ErrorMessage error={error} />;
  const episode = data?.episode;

  return (
    <Panel title={episode ? `${episode.episode} · ${episode.name}` : "Episode"} description={loading ? "Loading…" : episode?.air_date}>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {episode?.characters.map((character) => (
          <li key={character.id} className="text-center text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={character.image} alt="" className="mb-1 aspect-square w-full rounded-md object-cover" loading="lazy" />
            {character.name}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  if (CombinedGraphQLErrors.is(error)) {
    return (
      <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        <p className="font-medium">The server rejected the query:</p>
        <ul className="list-disc pl-5">
          {error.errors.map((item, index) => (
            <li key={index}>{item.message}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      Network error: {error instanceof Error ? error.message : String(error)}
    </p>
  );
}
