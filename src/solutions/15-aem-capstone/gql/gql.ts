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
    "\n  query AdventuresAll($locale: String = \"en\") {\n    adventureList(_locale: $locale, sort: \"title ASC\") {\n      items {\n        _path\n        title\n        slug\n        activity\n        adventureType\n        price\n        tripLength\n        groupSize\n        difficulty\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        description {\n          plaintext\n        }\n      }\n    }\n  }\n": typeof types.AdventuresAllDocument,
    "\n  query AdventureBySlug($slug: String!, $variation: String, $locale: String = \"en\") {\n    adventureList(\n      _locale: $locale\n      variation: $variation\n      filter: { slug: { _expressions: [{ value: $slug }] } }\n    ) {\n      items {\n        _path\n        _variation\n        title\n        slug\n        description {\n          json\n          html\n        }\n        adventureType\n        tripLength\n        activity\n        groupSize\n        difficulty\n        price\n        departureDate\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        location {\n          name\n          city\n          country\n          region\n          coordinates\n        }\n        itinerary {\n          json\n          html\n        }\n        gearList {\n          json\n          html\n        }\n      }\n      _references {\n        ... on ImageRef {\n          _path\n          _dynamicUrl\n        }\n      }\n    }\n  }\n": typeof types.AdventureBySlugDocument,
};
const documents: Documents = {
    "\n  query AdventuresAll($locale: String = \"en\") {\n    adventureList(_locale: $locale, sort: \"title ASC\") {\n      items {\n        _path\n        title\n        slug\n        activity\n        adventureType\n        price\n        tripLength\n        groupSize\n        difficulty\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        description {\n          plaintext\n        }\n      }\n    }\n  }\n": types.AdventuresAllDocument,
    "\n  query AdventureBySlug($slug: String!, $variation: String, $locale: String = \"en\") {\n    adventureList(\n      _locale: $locale\n      variation: $variation\n      filter: { slug: { _expressions: [{ value: $slug }] } }\n    ) {\n      items {\n        _path\n        _variation\n        title\n        slug\n        description {\n          json\n          html\n        }\n        adventureType\n        tripLength\n        activity\n        groupSize\n        difficulty\n        price\n        departureDate\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        location {\n          name\n          city\n          country\n          region\n          coordinates\n        }\n        itinerary {\n          json\n          html\n        }\n        gearList {\n          json\n          html\n        }\n      }\n      _references {\n        ... on ImageRef {\n          _path\n          _dynamicUrl\n        }\n      }\n    }\n  }\n": types.AdventureBySlugDocument,
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
export function graphql(source: "\n  query AdventuresAll($locale: String = \"en\") {\n    adventureList(_locale: $locale, sort: \"title ASC\") {\n      items {\n        _path\n        title\n        slug\n        activity\n        adventureType\n        price\n        tripLength\n        groupSize\n        difficulty\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        description {\n          plaintext\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdventuresAll($locale: String = \"en\") {\n    adventureList(_locale: $locale, sort: \"title ASC\") {\n      items {\n        _path\n        title\n        slug\n        activity\n        adventureType\n        price\n        tripLength\n        groupSize\n        difficulty\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        description {\n          plaintext\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdventureBySlug($slug: String!, $variation: String, $locale: String = \"en\") {\n    adventureList(\n      _locale: $locale\n      variation: $variation\n      filter: { slug: { _expressions: [{ value: $slug }] } }\n    ) {\n      items {\n        _path\n        _variation\n        title\n        slug\n        description {\n          json\n          html\n        }\n        adventureType\n        tripLength\n        activity\n        groupSize\n        difficulty\n        price\n        departureDate\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        location {\n          name\n          city\n          country\n          region\n          coordinates\n        }\n        itinerary {\n          json\n          html\n        }\n        gearList {\n          json\n          html\n        }\n      }\n      _references {\n        ... on ImageRef {\n          _path\n          _dynamicUrl\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdventureBySlug($slug: String!, $variation: String, $locale: String = \"en\") {\n    adventureList(\n      _locale: $locale\n      variation: $variation\n      filter: { slug: { _expressions: [{ value: $slug }] } }\n    ) {\n      items {\n        _path\n        _variation\n        title\n        slug\n        description {\n          json\n          html\n        }\n        adventureType\n        tripLength\n        activity\n        groupSize\n        difficulty\n        price\n        departureDate\n        primaryImage {\n          ... on ImageRef {\n            _path\n            _dynamicUrl\n            mimeType\n            width\n            height\n          }\n        }\n        location {\n          name\n          city\n          country\n          region\n          coordinates\n        }\n        itinerary {\n          json\n          html\n        }\n        gearList {\n          json\n          html\n        }\n      }\n      _references {\n        ... on ImageRef {\n          _path\n          _dynamicUrl\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;