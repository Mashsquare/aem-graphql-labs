"use client";

import { QueryClient, QueryClientProvider, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Badge, CardGrid, EmptyState, MediaCard, Panel, buttonClass, primaryButtonClass } from "@/components/lab-ui";
import type { CharacterFilter, CharacterStatus } from "@/labs/05-tanstack-query/api";
import { characterKeys, describeError, fetchCharactersPage, getNextPageParam } from "./api";

/** Provided: one QueryClient per mounted provider, with a sensible default staleTime. */
export function QueryLabProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const statuses: (CharacterStatus | undefined)[] = [undefined, "alive", "dead", "unknown"];

export function CharacterGallery() {
  const [filter, setFilter] = useState<CharacterFilter>({});
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: characterKeys.list(filter),
    queryFn: ({ pageParam }) => fetchCharactersPage(pageParam, filter),
    initialPageParam: 1,
    getNextPageParam,
  });

  // Hovering a filter warms the cache, so the click renders instantly.
  const prefetch = (status: CharacterStatus | undefined) => {
    const next = status ? { status } : {};
    void queryClient.prefetchInfiniteQuery({
      queryKey: characterKeys.list(next),
      queryFn: ({ pageParam }) => fetchCharactersPage(pageParam, next),
      initialPageParam: 1,
    });
  };

  const characters = query.data?.pages.flatMap((page) => page.results) ?? [];
  const total = query.data?.pages[0]?.info.count;

  return (
    <Panel
      title="Characters"
      description={total ? `${characters.length} of ${total} loaded` : "…"}
      actions={
        <>
          {query.isFetching && !query.isFetchingNextPage ? <Badge tone="warn">fetching</Badge> : null}
          {query.isStale ? <Badge>stale</Badge> : <Badge tone="ok">fresh</Badge>}
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status ?? "all"}
            onMouseEnter={() => prefetch(status)}
            onClick={() => setFilter(status ? { status } : {})}
            className={`${buttonClass} ${filter.status === status ? "border-accent text-accent" : ""}`}
          >
            {status ?? "all"}
          </button>
        ))}
      </div>

      {query.isError ? (
        <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{describeError(query.error)}</p>
      ) : null}

      {query.isPending ? (
        <EmptyState>Loading the first page…</EmptyState>
      ) : (
        <CardGrid>
          {characters.map((character) => (
            <MediaCard key={character.id} title={character.name} imageUrl={character.image} meta={[character.status, character.species]} />
          ))}
        </CardGrid>
      )}

      {query.hasNextPage ? (
        <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className={`${primaryButtonClass} mt-4`}>
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </Panel>
  );
}
