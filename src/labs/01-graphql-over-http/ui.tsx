/**
 * Provided UI for Lab 01 — you don't need to edit this file.
 * It receives your data functions as props, so the same UI renders your work and the solution.
 */
import Link from "next/link";
import { Badge, EmptyState, Panel, QueryPeek } from "@/components/lab-ui";
import type { Continent, Country } from "./api";

export interface CountriesApi {
  getContinents: () => Promise<Continent[]>;
  getCountry: (code: string) => Promise<Country | null>;
  continentsQuery: string;
  countryQuery: string;
}

export async function CountriesView({ api, countryCode }: { api: CountriesApi; countryCode?: string }) {
  const continents = await api.getContinents();
  const country = countryCode ? await api.getCountry(countryCode.toUpperCase()) : undefined;

  return (
    <div className="space-y-6">
      <Panel title="Continents" description={`${continents.length} continents returned by your query`}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {continents.map((continent) => (
            <li key={continent.code} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{continent.name}</span>
                <Badge>{continent.countries.length} countries</Badge>
              </div>
              <p className="mt-2 flex flex-wrap gap-1 text-xs">
                {continent.countries.slice(0, 8).map((item) => (
                  <Link key={item.code} href={`?country=${item.code}`} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono hover:text-accent">
                    {item.code}
                  </Link>
                ))}
                {continent.countries.length > 8 ? <span className="text-muted">+{continent.countries.length - 8}</span> : null}
              </p>
            </li>
          ))}
        </ul>
        <QueryPeek label="Your CONTINENTS_QUERY" query={api.continentsQuery} />
      </Panel>

      <Panel title="Country" description="Pick a country code above, or try ?country=BR / ?country=XX">
        {country === undefined ? (
          <EmptyState>No country selected.</EmptyState>
        ) : country === null ? (
          <EmptyState>
            The API returned <code>country: null</code> for “{countryCode}” — a valid response, not an error.
          </EmptyState>
        ) : (
          <div className="flex items-start gap-4">
            <span className="text-5xl leading-none">{country.emoji}</span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium">
                {country.name} <span className="text-muted">({country.native})</span>
              </dd>
              <dt className="text-muted">Capital</dt>
              <dd>{country.capital ?? "—"}</dd>
              <dt className="text-muted">Currency</dt>
              <dd>{country.currency ?? "—"}</dd>
              <dt className="text-muted">Languages</dt>
              <dd>{country.languages.map((language) => language.name).join(", ") || "—"}</dd>
              <dt className="text-muted">Continent</dt>
              <dd>{country.continent.name}</dd>
            </dl>
          </div>
        )}
        <QueryPeek label="Your COUNTRY_QUERY" query={api.countryQuery} />
      </Panel>
    </div>
  );
}
