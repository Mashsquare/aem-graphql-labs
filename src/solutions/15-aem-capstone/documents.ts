import { graphql } from "./gql";

/**
 * Typed copies of the persisted queries the site runs (from GET /graphql/list.json on Publish).
 *
 * The app EXECUTES them by name (GET /graphql/execute.json/wknd-shared/<name>) but keeps the
 * document here so GraphQL Codegen can generate exact result types. lab.test.ts checks that these
 * documents still match what is persisted in AEM — a contract test between frontend and AEM.
 */

export const PERSISTED_ADVENTURES_ALL = "wknd-shared/adventures-all";
export const PERSISTED_ADVENTURE_BY_SLUG = "wknd-shared/adventure-by-slug";

export const adventuresAllQuery = graphql(`
  query AdventuresAll($locale: String = "en") {
    adventureList(_locale: $locale, sort: "title ASC") {
      items {
        _path
        title
        slug
        activity
        adventureType
        price
        tripLength
        groupSize
        difficulty
        primaryImage {
          ... on ImageRef {
            _path
            _dynamicUrl
            mimeType
            width
            height
          }
        }
        description {
          plaintext
        }
      }
    }
  }
`);

export const adventureBySlugQuery = graphql(`
  query AdventureBySlug($slug: String!, $variation: String, $locale: String = "en") {
    adventureList(
      _locale: $locale
      variation: $variation
      filter: { slug: { _expressions: [{ value: $slug }] } }
    ) {
      items {
        _path
        _variation
        title
        slug
        description {
          json
          html
        }
        adventureType
        tripLength
        activity
        groupSize
        difficulty
        price
        departureDate
        primaryImage {
          ... on ImageRef {
            _path
            _dynamicUrl
            mimeType
            width
            height
          }
        }
        location {
          name
          city
          country
          region
          coordinates
        }
        itinerary {
          json
          html
        }
        gearList {
          json
          html
        }
      }
      _references {
        ... on ImageRef {
          _path
          _dynamicUrl
        }
      }
    }
  }
`);
