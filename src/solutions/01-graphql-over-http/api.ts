import type { Continent, ContinentsData, Country, CountryData } from "@/labs/01-graphql-over-http/api";

export const COUNTRIES_API = "https://countries.trevorblades.com/graphql";

interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: { message: string }[];
}

export async function graphqlRequest<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const response = await fetch(COUNTRIES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: HTTP ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as GraphQLResponse<TData>;
  // A 200 response can still carry errors — check them before trusting `data`.
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join("; "));
  }
  if (!body.data) {
    throw new Error("GraphQL response contained no data");
  }
  return body.data;
}

export const CONTINENTS_QUERY = /* GraphQL */ `
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
  const data = await graphqlRequest<ContinentsData>(CONTINENTS_QUERY);
  return data.continents;
}

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
  const data = await graphqlRequest<CountryData>(COUNTRY_QUERY, { code });
  return data.country;
}
