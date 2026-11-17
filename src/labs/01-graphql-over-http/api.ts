import { todo } from "@/lib/todo";
import { TdHTMLAttributes } from "react";

export const COUNTRIES_API = "https://countries.trevorblades.com/graphql";

/* -------------------------------------------------------------------------- */
/* Types — the shape of the data you will select (see PROMPT.md)              */
/* -------------------------------------------------------------------------- */

export interface Continent {
  code: string;
  name: string;
  countries: { code: string }[];
}

export interface ContinentsData {
  continents: Continent[];
}

export interface Country {
  code: string;
  name: string;
  native: string;
  capital: string | null;
  emoji: string;
  currency: string | null;
  languages: { code: string; name: string }[];
  continent: { name: string };
}

export interface CountryData {
  country: Country | null;
}

/* -------------------------------------------------------------------------- */
/* Task 1 — a generic GraphQL request over HTTP                                */
/* -------------------------------------------------------------------------- */

interface GraphQLResponse<TData>{
  data?: TData;
  errors?: {message:string}[];
}

export async function graphqlRequest<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const response = await fetch(COUNTRIES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({query, variables}),
  });
  if(!response.ok) throw new Error("Something went wrong: "+response.status);
  const body: GraphQLResponse<TData> = await response.json();
  if(body.errors && body.errors.length > 0){
    let messages = body.errors.map(error=> error.message).join("; ");
    throw new Error (messages);
  }
  return body.data as TData;


}

/* -------------------------------------------------------------------------- */
/* Tasks 2 + 3 — continents                                                    */
/* -------------------------------------------------------------------------- */

export const CONTINENTS_QUERY =  `
  query Continents {
    continents {
      code
      name
      countries {
        code
      }
    }
  }

`;

export async function getContinents(): Promise<Continent[]> {
  const result = await graphqlRequest<ContinentsData>(CONTINENTS_QUERY);
  return result.continents;
}

/* -------------------------------------------------------------------------- */
/* Tasks 4 + 5 — one country, selected with a variable                         */
/* -------------------------------------------------------------------------- */

export const COUNTRY_QUERY = /* GraphQL */ `
  query Country($code: ID!) {
    country(code: $code) {
      code
      name
      native
      capital
      emoji
      currency
      languages {
        code
        name
      }
      continent {
        name
      }
    }
  }
`;

export async function getCountry(code: string): Promise<Country | null> {
  const result = await graphqlRequest<CountryData | null>(COUNTRY_QUERY, {code});
  return result?.country ?? null;
}
