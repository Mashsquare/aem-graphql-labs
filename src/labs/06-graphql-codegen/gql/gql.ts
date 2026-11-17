/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AdventureTeaser on AdventureModel {\n    _path\n    title\n    slug\n    activity\n    price\n    tripLength\n    primaryImage {\n      # Content references are a union (ImageRef | DocumentRef | …): select __typename to tell them apart.\n      __typename\n      ... on ImageRef {\n        _dynamicUrl\n        width\n        height\n      }\n    }\n  }\n": typeof types.AdventureTeaserFragmentDoc,
    "\n  query AdventureTeasers($filter: AdventureModelFilter) {\n    adventureList(filter: $filter, limit: 3) {\n      items {\n        ...AdventureTeaser\n      }\n    }\n  }\n": typeof types.AdventureTeasersDocument,
};
const documents: Documents = {
    "\n  fragment AdventureTeaser on AdventureModel {\n    _path\n    title\n    slug\n    activity\n    price\n    tripLength\n    primaryImage {\n      # Content references are a union (ImageRef | DocumentRef | …): select __typename to tell them apart.\n      __typename\n      ... on ImageRef {\n        _dynamicUrl\n        width\n        height\n      }\n    }\n  }\n": types.AdventureTeaserFragmentDoc,
    "\n  query AdventureTeasers($filter: AdventureModelFilter) {\n    adventureList(filter: $filter, limit: 3) {\n      items {\n        ...AdventureTeaser\n      }\n    }\n  }\n": types.AdventureTeasersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AdventureTeaser on AdventureModel {\n    _path\n    title\n    slug\n    activity\n    price\n    tripLength\n    primaryImage {\n      # Content references are a union (ImageRef | DocumentRef | …): select __typename to tell them apart.\n      __typename\n      ... on ImageRef {\n        _dynamicUrl\n        width\n        height\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AdventureTeaser on AdventureModel {\n    _path\n    title\n    slug\n    activity\n    price\n    tripLength\n    primaryImage {\n      # Content references are a union (ImageRef | DocumentRef | …): select __typename to tell them apart.\n      __typename\n      ... on ImageRef {\n        _dynamicUrl\n        width\n        height\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdventureTeasers($filter: AdventureModelFilter) {\n    adventureList(filter: $filter, limit: 3) {\n      items {\n        ...AdventureTeaser\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdventureTeasers($filter: AdventureModelFilter) {\n    adventureList(filter: $filter, limit: 3) {\n      items {\n        ...AdventureTeaser\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;