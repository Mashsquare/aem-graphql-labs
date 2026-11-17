"use client";

import { useState, type ReactNode } from "react";
import { Provider, useQuery, type CombinedError, type RequestPolicy } from "urql";
import { Badge, EmptyState, Field, Panel, buttonClass, inputClass } from "@/components/lab-ui";
import { CONTINENTS_QUERY, COUNTRIES_QUERY, createUrqlClient } from "./urql";

export function UrqlLabProvider({ children }: { children: ReactNode }) {
  // useState(factory) creates the client once per mounted provider — never on every render.
  const [client] = useState(createUrqlClient);
  return <Provider value={client}>{children}</Provider>;
}

const policies: RequestPolicy[] = ["cache-first", "cache-and-network", "network-only", "cache-only"];

export function CountryBrowser() {
  const [continent, setContinent] = useState<string>("");
  const [requestPolicy, setRequestPolicy] = useState<RequestPolicy>("cache-first");

  // urql hooks return a [result, reexecute] tuple.
  const [continents] = useQuery({ query: CONTINENTS_QUERY });

  const [countries, reexecuteCountries] = useQuery({
    query: COUNTRIES_QUERY,
    variables: { continent },
    // No continent yet -> don't send a request with an empty variable.
    pause: !continent,
    requestPolicy,
  });

  const refresh = () => reexecuteCountries({ requestPolicy: "network-only" });

  const cacheOutcome = countries.operation?.context.meta?.cacheOutcome;

  return (
    <div className="space-y-6">
      <Panel title="Continents" description={continents.fetching ? "Loading…" : "Pick one to load its countries"}>
        <ErrorNote error={continents.error} />
        <div className="flex flex-wrap gap-2">
          {continents.data?.continents.map((item) => (
            <button
              key={item.code}
              onClick={() => setContinent(item.code)}
              className={`${buttonClass} ${continent === item.code ? "border-accent text-accent" : ""}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title={continent ? `Countries in ${continent}` : "Countries"}
        description="Switch continents back and forth and watch the cache outcome."
        actions={
          <>
            {countries.fetching ? <Badge tone="warn">fetching</Badge> : null}
            {countries.stale ? <Badge tone="warn">stale</Badge> : null}
            {cacheOutcome ? <Badge tone={cacheOutcome === "hit" ? "ok" : "neutral"}>cache {cacheOutcome}</Badge> : null}
          </>
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="requestPolicy">
            <select value={requestPolicy} onChange={(event) => setRequestPolicy(event.target.value as RequestPolicy)} className={inputClass}>
              {policies.map((policy) => (
                <option key={policy}>{policy}</option>
              ))}
            </select>
          </Field>
          <button onClick={refresh} disabled={!continent} className={buttonClass}>
            Refresh (network-only)
          </button>
        </div>
        <ErrorNote error={countries.error} />
        {!continent ? (
          <EmptyState>The countries query is paused until you pick a continent.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {countries.data?.countries.map((country) => (
              <li key={country.code} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-xl">{country.emoji}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{country.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {country.capital ?? "—"} · {country.currency ?? "—"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ErrorNote({ error }: { error?: CombinedError }) {
  if (!error) return null;
  // CombinedError merges network and GraphQL errors into one object.
  return (
    <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {error.networkError ? `Network: ${error.networkError.message}` : error.graphQLErrors.map((item) => item.message).join("; ")}
    </p>
  );
}
