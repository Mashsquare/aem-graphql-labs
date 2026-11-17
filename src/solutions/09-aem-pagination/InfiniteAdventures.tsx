"use client";

import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Badge, Panel, primaryButtonClass, formatPrice } from "@/components/lab-ui";
import { AemApolloProvider } from "@/lib/apollo/aem-provider";
import { ADVENTURES_CONNECTION_QUERY, paginationTypePolicies } from "./cursor";

export function InfiniteAdventuresApp() {
  return (
    <AemApolloProvider scope="solution-09" typePolicies={paginationTypePolicies}>
      <InfiniteAdventures />
    </AemApolloProvider>
  );
}

function InfiniteAdventures() {
  const { data, loading, error, networkStatus, fetchMore } = useQuery(ADVENTURES_CONNECTION_QUERY, {
    variables: { first: 5 },
    notifyOnNetworkStatusChange: true,
  });

  const connection = data?.adventurePaginated;

  const loadMore = () => {
    if (!connection?.pageInfo.endCursor) return;
    // relayStylePagination appends the new edges and updates pageInfo.
    void fetchMore({ variables: { after: connection.pageInfo.endCursor } });
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
