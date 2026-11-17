import { gql, type TypedDocumentNode, type TypePolicies } from "@apollo/client";
import type { AdventureSearchData, AdventureSearchVariables } from "@/labs/08-aem-filtering-sorting/types";

export { COUNTRIES_QUERY } from "@/labs/08-aem-filtering-sorting/queries";

export const ADVENTURE_SEARCH_QUERY: TypedDocumentNode<AdventureSearchData, AdventureSearchVariables> = gql`
  query AdventureSearch($filter: AdventureModelFilter, $sort: String, $locale: String = "en") {
    adventureList(filter: $filter, sort: $sort, _locale: $locale) {
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

export const aemTypePolicies: TypePolicies = {
  // Every AEM fragment type: identify it by its repository path.
  AdventureModel: { keyFields: ["_path"] },
  LocationModel: { keyFields: ["_path"] },
  // Deliberately NOT normalizing ImageRef by _path: the same asset can come back with different
  // _dynamicUrl values (one per _assetTransform), and one cache entry would overwrite the other.
};
