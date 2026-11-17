"use client";

import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Badge, CardGrid, EmptyState, JsonPeek, MediaCard, Panel, formatPrice } from "@/components/lab-ui";
import { aemImageUrl } from "@/lib/aem/image";
import { AemApolloProvider } from "@/lib/apollo/aem-provider";
import { todo } from "@/lib/todo";
import { buildAdventureFilter, buildSort } from "./filters";
import { COUNTRIES_QUERY, aemTypePolicies } from "./queries";
import { SearchForm } from "./SearchForm";
import type { AdventureSearchCriteria, AdventureSearchData, AdventureSearchVariables, AdventureSortKey } from "./types";

export function AdventureSearchApp() {
  return (
    <AemApolloProvider scope="lab-08" typePolicies={aemTypePolicies}>
      <AdventureSearch />
    </AemApolloProvider>
  );
}

function AdventureSearch() {
  const [criteria, setCriteria] = useState<AdventureSearchCriteria>({ activities: [] });
  const [sort, setSort] = useState<AdventureSortKey>("title");

  // Provided example: a second, independent query for the dropdown.
  const countriesResult = useQuery(COUNTRIES_QUERY);
  const countries = [...new Set(countriesResult.data?.locationList.items.map((item) => item.country).filter((country) => country !== null))];

  const variables: AdventureSearchVariables = { filter: buildAdventureFilter(criteria), sort: buildSort(sort) };

  // TODO (task 5): const { data, previousData, loading, error } = useQuery(ADVENTURE_SEARCH_QUERY, { variables });
  const { data, previousData, loading, error } = todo("call useQuery(ADVENTURE_SEARCH_QUERY, { variables }) in AdventureSearch.tsx") as {
    data?: AdventureSearchData;
    previousData?: AdventureSearchData;
    loading: boolean;
    error?: Error;
  };

  const hits = (data ?? previousData)?.adventureList.items ?? [];

  return (
    <div className="space-y-6">
      <Panel title="Find an adventure" description="Every change re-runs ONE query with a new $filter variable.">
        <SearchForm criteria={criteria} onChange={setCriteria} sort={sort} onSortChange={setSort} countries={countries} />
        <JsonPeek label="Variables sent to AEM" data={variables} />
      </Panel>

      <Panel title={`${hits.length} results`} actions={loading ? <Badge tone="warn">loading</Badge> : null}>
        {error ? <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error.message}</p> : null}
        {hits.length ? (
          <CardGrid>
            {hits.map((hit) => (
              <MediaCard
                key={hit._path}
                title={hit.title}
                imageUrl={hit.primaryImage?._dynamicUrl ? aemImageUrl(hit.primaryImage._dynamicUrl, { width: 600 }) : null}
                badge={<Badge tone="accent">{hit.activity}</Badge>}
                meta={[formatPrice(hit.price), hit.difficulty, `group ${hit.groupSize}`, hit.location?.country, hit.departureDate]}
              />
            ))}
          </CardGrid>
        ) : loading ? null : (
          <EmptyState>No adventure matches all filters.</EmptyState>
        )}
      </Panel>
    </div>
  );
}
