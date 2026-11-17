import { gql, type TypedDocumentNode, type TypePolicies } from "@apollo/client";
import type { AdventureSearchData, AdventureSearchVariables, CountriesData } from "./types";

/** Provided example: a simple list query used to fill the country dropdown. */
export const COUNTRIES_QUERY: TypedDocumentNode<CountriesData, Record<string, never>> = gql`
  query LocationCountries {
    locationList(sort: "country ASC") {
      items {
        _path
        country
      }
    }
  }
`;

/**
 * Task 3 — one query, the whole filter as a variable:
 *   query AdventureSearch($filter: AdventureModelFilter, $sort: String, $locale: String = "en")
 * Select the fields of AdventureHit (types.ts). Every object Apollo normalizes needs its key field,
 * so select `_path` on the adventure AND on the nested location.
 */
export const ADVENTURE_SEARCH_QUERY: TypedDocumentNode<AdventureSearchData, AdventureSearchVariables> = gql`
  query AdventureSearch($filter: AdventureModelFilter, $sort: String, $locale:String = "en") {
    adventureList (filter: $filter, sort: $sort, _locale: $locale){
      items {
        _path
        title
        activity
        difficulty
        price
        groupSize
        departureDate
        primaryImage {
          ... on ImageRef {
            _path
            _dynamicUrl
          }
        }
        location {
          _path
          city
          country
        }
      }
    }
  }
`;

/**
 * Task 4 — AEM fragments have no `id`. Tell Apollo to identify them by `_path`,
 * otherwise nothing is normalized (and updates to one fragment don't show up elsewhere).
 */
export const aemTypePolicies: TypePolicies = {
  // TODO: AdventureModel: { keyFields: ["_path"] }, LocationModel: { keyFields: ["_path"] }
  AdventureModel: { keyFields: ["_path"] },
  LocationModel: { keyFields: ["_path"] },
};
