import { param, type LabViewProps } from "@/lib/lab-view";
import { CountriesView } from "@/labs/01-graphql-over-http/ui";
import { CONTINENTS_QUERY, COUNTRY_QUERY, getContinents, getCountry } from "./api";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <CountriesView
      api={{ getContinents, getCountry, continentsQuery: CONTINENTS_QUERY, countryQuery: COUNTRY_QUERY }}
      countryCode={param(searchParams, "country")}
    />
  );
}
