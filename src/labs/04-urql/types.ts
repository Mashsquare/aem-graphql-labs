/** Result and variable types for Lab 04 — provided. */

export interface ContinentsData {
  continents: { code: string; name: string }[];
}

export interface CountrySummary {
  code: string;
  name: string;
  emoji: string;
  capital: string | null;
  currency: string | null;
}

export interface CountriesData {
  countries: CountrySummary[];
}

export interface CountriesVariables {
  continent: string;
}
