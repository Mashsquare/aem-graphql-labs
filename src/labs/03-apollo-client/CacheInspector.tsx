"use client";

/**
 * Provided — shows what Apollo's normalized cache contains right now (client.cache.extract()).
 * Watch how entities are stored once (Episode:1, Character:2) and how ROOT_QUERY field keys
 * change when you adjust `keyArgs`.
 */
import { useApolloClient } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { Panel } from "@/components/lab-ui";

export function CacheInspector() {
  const client = useApolloClient();
  const [snapshot, setSnapshot] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    const update = () => setSnapshot(client.cache.extract() as Record<string, Record<string, unknown>>);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [client]);

  const counts = new Map<string, number>();
  for (const key of Object.keys(snapshot)) {
    if (key === "ROOT_QUERY") continue;
    const typename = key.split(":")[0];
    counts.set(typename, (counts.get(typename) ?? 0) + 1);
  }
  const rootFields = Object.keys(snapshot.ROOT_QUERY ?? {}).filter((field) => field !== "__typename");

  return (
    <Panel title="Cache inspector" description="client.cache.extract(), refreshed every second">
      <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">Normalized entities</h3>
      {counts.size ? (
        <ul className="mb-4 space-y-0.5 font-mono text-xs">
          {[...counts].map(([typename, count]) => (
            <li key={typename}>
              {typename}: {count}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-muted">empty</p>
      )}
      <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">ROOT_QUERY fields</h3>
      <ul className="space-y-1 font-mono text-[11px] break-all">
        {rootFields.length ? rootFields.map((field) => <li key={field}>{field}</li>) : <li className="text-muted">none yet</li>}
      </ul>
    </Panel>
  );
}
