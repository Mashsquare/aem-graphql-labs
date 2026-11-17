"use client";

import { NetworkStatus } from "@apollo/client";
import type { useQuery } from "@apollo/client/react";
import { Badge, Panel, primaryButtonClass, formatPrice } from "@/components/lab-ui";
import { AemApolloProvider } from "@/lib/apollo/aem-provider";
import { todo } from "@/lib/todo";
import { paginationTypePolicies } from "./cursor";
import type { AdventuresConnectionData, AdventuresConnectionVariables } from "./types";

export function InfiniteAdventuresApp() {
  return (
    <AemApolloProvider scope="lab-09" typePolicies={paginationTypePolicies}>
      <InfiniteAdventures />
    </AemApolloProvider>
  );
}

function InfiniteAdventures() {
  // TODO (task 6): useQuery(ADVENTURES_CONNECTION_QUERY, { variables: { first: 5 }, notifyOnNetworkStatusChange: true })
  const { data, loading, error, networkStatus, fetchMore } = todo(
    "call useQuery(ADVENTURES_CONNECTION_QUERY, …) in InfiniteAdventures.tsx",
  ) as useQuery.Result<AdventuresConnectionData, AdventuresConnectionVariables, "empty" | "complete" | "streaming">;

  const connection = data?.adventurePaginated;

  const loadMore = () => {
    // TODO (task 7): fetchMore({ variables: { after: connection.pageInfo.endCursor } })
    void fetchMore;
  };

  return (
    <Panel
      title="Part B · cursor (adventurePaginated + relayStylePagination)"
      description={connection ? `${connection.edges.length} loaded` : "Loading…"}
      actions={loading ? <Badge tone="warn">{NetworkStatus[networkStatus]}</Badge> : null}
    >
      {error ? <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error.message}</p> : null}
      <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-sm">
        {connection?.edges.map(({ cursor, node }) => (
          <li key={node._path}>
            <span className="font-medium">{node.title}</span> <span className="text-muted">{formatPrice(node.price)}</span>
            <span className="ml-2 font-mono text-[10px] text-muted" title={cursor}>
              cursor {cursor.slice(0, 12)}…
            </span>
          </li>
        ))}
      </ol>
      {connection?.pageInfo.hasNextPage ? (
        <button onClick={loadMore} disabled={networkStatus === NetworkStatus.fetchMore} className={primaryButtonClass}>
          Load 5 more
        </button>
      ) : connection ? (
        <p className="text-sm text-muted">hasNextPage: false — that&apos;s everything.</p>
      ) : null}
    </Panel>
  );
}
