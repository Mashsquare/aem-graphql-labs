import { param, type LabViewProps } from "@/lib/lab-view";
import { CONTINENTS_QUERY, COUNTRY_QUERY, getContinents, getCountry } from "./api";
import { CountriesView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return (
    <CountriesView
      api={{ getContinents, getCountry, continentsQuery: CONTINENTS_QUERY, countryQuery: COUNTRY_QUERY }}
      countryCode={param(searchParams, "country")}
    />
  );
}
