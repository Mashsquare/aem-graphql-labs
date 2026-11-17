import { graphql } from "./gql";

export const adventureTeaserFragment = graphql(`
  fragment AdventureTeaser on AdventureModel {
    _path
    title
    slug
    activity
    difficulty
    price
    tripLength
    primaryImage {
      __typename
      ... on ImageRef {
        _dynamicUrl
        width
        height
      }
    }
  }
`);

export const adventureTeasersQuery = graphql(`
  query AdventureTeasers($filter: AdventureModelFilter, $locale: String = "en") {
    adventureList(filter: $filter, _locale: $locale, sort: "title ASC") {
      items {
        ...AdventureTeaser
      }
    }
  }
`);
