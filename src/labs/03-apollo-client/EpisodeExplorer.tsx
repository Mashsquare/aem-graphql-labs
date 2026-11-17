"use client";

import { NetworkStatus } from "@apollo/client";
import { skipToken, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Badge, EmptyState, Field, Panel, inputClass, primaryButtonClass } from "@/components/lab-ui";
import { EPISODES_QUERY, EPISODE_QUERY } from "./queries";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

export function EpisodeExplorer() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // TODO (task 4): replace the placeholder below with
  //   useQuery(EPISODES_QUERY, { variables: { page: 1, filter: { name: search } }, notifyOnNetworkStatusChange: true })
  // (import useQuery as a *value* from "@apollo/client/react" and EPISODES_QUERY from "./queries")
  const { data, previousData, loading, error, networkStatus, fetchMore } = useQuery(EPISODES_QUERY, { variables: { page: 1, filter: { name: search } }, notifyOnNetworkStatusChange: true })


  // Keep showing the previous list while a new search is loading (no flicker).
  const page = (data ?? previousData)?.episodes;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const loadMore = () => {
    const next = page?.info.next;
    if (next == null) return;
    fetchMore({ variables: { page: next } });
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
  // TODO (task 6): useQuery(EPISODE_QUERY, id ? { variables: { id } } : skipToken)
  // Select the same episode twice: the second time is answered from the cache instantly.
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
  // TODO (task 7): distinguish GraphQL errors from network errors with CombinedGraphQLErrors.is(error)
  // (import { CombinedGraphQLErrors } from "@apollo/client/errors") and list error.errors[].message
  const messages = CombinedGraphQLErrors.is(error)
    ? error.errors.map((err) => err.message)
    : [error instanceof Error ? error.message : String(error)];
  return (
    <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {messages.map((message, index) => (
        <p key={index}>{message}</p>
      ))}
    </div>
  );
}
