import { graphql } from "./gql";

/**
 * Documents written with the generated `graphql()` function. Codegen scans this file, and after
 * `npm run codegen` each call returns a fully typed TypedDocumentNode.
 *
 * Workflow: edit a document -> run `npm run codegen` (or keep `npm run codegen:watch` open) ->
 * TypeScript immediately reflects the change everywhere the document is used.
 */

/** The data one teaser card needs — colocated with AdventureTeaser.tsx in spirit. */
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


/**
 * TODO (task 2): add `$locale: String = "en"` and pass `_locale: $locale` and `sort: "title ASC"`;
 * remove the `limit: 3`. Then run codegen and look at AdventureTeasersQueryVariables.
 * ($filter is already declared — that's why codegen emitted the AdventureModelFilter input type.)
 */
export const adventureTeasersQuery = graphql(`
  query AdventureTeasers($filter: AdventureModelFilter) {
    adventureList(filter: $filter, limit: 3) {
      items {
        ...AdventureTeaser
      }
    }
  }
`);
